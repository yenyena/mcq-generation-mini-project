from flask import Flask, request, jsonify, json
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
import os
import pdfplumber
import tiktoken
import openai
from openai import OpenAI
import nltk
from nltk.tokenize import sent_tokenize
import random
import re
from transformers import AutoTokenizer, AutoModel
import torch
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def get_json(quiz):
    json_dict = {"question": (
        re.search(r'<Question>(.*?)(</Question>|<Question>)', quiz, re.DOTALL).group(1)), "option1": (
        re.search(r'<Option 1>(.*?)(</Option 1>|<Option 1>)', quiz, re.DOTALL).group(1)), "option2": (
        re.search(r'<Option 2>(.*?)(</Option 2>|<Option 2>)', quiz, re.DOTALL).group(1)), "option3": (
        re.search(r'<Option 3>(.*?)(</Option 3>|<Option 3>)', quiz, re.DOTALL).group(1)), "option4": (
        re.search(r'<Option 4>(.*?)(</Option 4>|<Option 4>)', quiz, re.DOTALL).group(1)), "explanation1": (
        re.search(r'<Explanation 1>(.*?)(</Explanation 1>|<Explanation 1>)', quiz, re.DOTALL).group(1)),
        "explanation2": (
            re.search(r'<Explanation 2>(.*?)(</Explanation 2>|<Explanation 2>)', quiz, re.DOTALL).group(1)),
        "explanation3": (
            re.search(r'<Explanation 3>(.*?)(</Explanation 3>|<Explanation 3>)', quiz, re.DOTALL).group(1)),
        "explanation4": (
            re.search(r'<Explanation 4>(.*?)(</Explanation 4>|<Explanation 4>)', quiz, re.DOTALL).group(1))}
    return json_dict


class Model:
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)
        openai.api_key = api_key
        if openai.api_key == "":
            raise Exception("No API key provided")
        self.question_embeddings = None

    def generate(self, pdf_text, system_prompt="", model="gpt-3.5-turbo", temperature=0.0):
        messages = [{"role": "system", "content": system_prompt},
                    {"role": "user", "content": "<Text>"+pdf_text+"</Text>"}] if system_prompt else [{"role": "user", "content": "<Text>"+pdf_text+"</Text>"}]
        response = self.client.chat.completions.create(
            model=model,
            temperature=temperature,
            messages=messages
        )
        return response.choices[0].message.content


class PDFProcessor:
    def __init__(self):
        self.prompt = None
        self.client = None
        self.api_key = None
        self.upload_folder = './uploads'
        self.allowed_extensions = {'pdf'}
        self.full_text = ""
        self.segments = []
        self.sliding_sequences = []
        self.model = None
        self.embed_tokenizer = None
        self.embed_model = None
        self.generated_questions = {}
        self.load_config()
        self.initialize_model()

    def load_config(self):
        api_key_json = "./files/chatgpt_api_key.json"
        with open(api_key_json) as f:
            api_key_data = json.load(f)
        self.api_key = api_key_data['key']
        self.client = OpenAI(api_key=self.api_key)
        with open("./files/prompt.txt", "r", encoding='utf-8') as f:
            self.prompt = f.read()

    def initialize_model(self):
        self.model = Model(self.api_key)
        self.embed_tokenizer = AutoTokenizer.from_pretrained("mixedbread-ai/mxbai-embed-large-v1")
        self.embed_model = AutoModel.from_pretrained("mixedbread-ai/mxbai-embed-large-v1")

    def allowed_file(self, filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions

    def upload_file(self):
        if 'file' not in request.files:
            return jsonify({'message': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400
        if file and self.allowed_file(file.filename):
            filename = secure_filename(file.filename)
            save_path = os.path.join(self.upload_folder, filename)
            file.save(save_path)
            return self.process_pdf_file(save_path, filename)
        else:
            return jsonify({'message': 'Invalid file type'}), 400

    def process_pdf_file(self, save_path, filename):
        try:
            text_by_page = []
            with pdfplumber.open(save_path) as pdf:
                for page in pdf.pages:
                    text_blocks = page.extract_text(x_tolerance=2, y_tolerance=2)
                    page_text = ""
                    if text_blocks:
                        for block in text_blocks.split('\n'):
                            if block.isupper():
                                page_text += "\n\n" + block + "\n"
                            else:
                                page_text += block + "\n"
                        text_by_page.append(page_text.strip())
            self.full_text = "\n\n".join(text_by_page)
            self.segments = self.segment_text(self.full_text)
            self.sliding_sequences = self.get_sliding_sequences(self.segments)
            return jsonify({'message': f'File {filename} uploaded successfully', 'content': self.full_text}), 200
        except Exception as e:
            return jsonify({'message': 'Failed to read PDF', 'error': str(e)}), 500

    def segment_text(self, text, max_length=16385):
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(text)
        temp_segments = []
        current_segment = []
        for token in tokens:
            if len(current_segment) < max_length:
                current_segment.append(token)
            else:
                temp_segments.append(current_segment)
                current_segment = [token]
        if current_segment:
            temp_segments.append(current_segment)
        segments = []
        for segment in temp_segments:
            segments.append(encoding.decode(segment))
        return segments

    def get_sliding_sequences(self, segments, length=3):
        individual_sentences = [sentence for text in segments for sentence in sent_tokenize(text)]
        sliding_sequences = []
        for i in range(len(individual_sentences) - (length - 1)):
            sliding_sequences.append(" ".join(individual_sentences[i:i + length]))
        return sliding_sequences

    def get_embeddings(self, text):
        encoded_input = self.embed_tokenizer(text, padding=True, truncation=True, return_tensors='pt')

        with torch.no_grad():
            model_output = self.embed_model(**encoded_input)

        return model_output.last_hidden_state[:, 0, :].numpy()

    def check_similarity(self, new_embedding, existing_embeddings, threshold=0.8):
        similarities = cosine_similarity(new_embedding, existing_embeddings)

        if np.any(similarities > threshold):
            return False  # too similar, discard it
        else:
            return True  # not similar, keep it

    def get_sample_text(self):
        try:
            self.full_text = """
                An Olympic blog\nWhat an Olympics!\nPosted by Helen Nolan on 10 September, 2012 at 21:25\nIt’s all over! I’ve 
                been writing my blog from London every day during the Olympics and the Paralympics and this is my final post 
                to look back on a wonderful couple of months. Here are some of the things that were the most memorable for 
                me:\nThe Opening Ceremony\nThis set the scene for the Games with an amazing show featuring music, dancing, 
                historical figures, fireworks and British humour. A huge number of volunteers practised for months to make 
                everything perfect. The best moment was when the old lady in Buckingham Palace turned round and showed that 
                she was neither a lookalike nor an actor but Her Majesty the Queen. The next best bit was when she jumped out 
                of a helicopter with James Bond (although I think that actually was an actor!).\nTeam GB\nI was very proud of 
                our team as we kept on winning medals and finished in third position in the medal table, which is truly a great 
                result for Great Britain. There were so many incredible sportsmen and women. The ones that stand out for me are 
                Mo Farah, the Somalian-born Londoner who won the 10,000 and 5,000 metres with the whole stadium going crazy, 
                Jessica Ennis, the popular super-athlete from Sheffield who won the heptathlon, and Nicola Adams who won the 
                first female boxing medal in Olympic history for Britain.\nThe Olympic Stadium crowd\nAlthough the crowd cheered
                 on the British, there was lots of support for athletes of other nationalities too like the wonderful Usain 
                 Bolt, from Jamaica, who won the 100 and 200 metres sprint to become the fastest man alive. There was also 
                 Oscar Pistorius of South Africa who was the first disabled person to compete in the Olympics. He went on to 
                 win two gold medals and a silver in the Paralympics.\nNew sports\nI have really enjoyed being able to watch 
                 sports which are not normally shown on television. Before the Olympics I didn’t expect to love watching judo 
                 or find myself screaming at the television during a game of wheelchair tennis, but I really got into them. I 
                 didn’t know anything about goalball before the Paralympics but it became one of my favourite sports.\nThe 
                 organisation and the atmosphere\nIt took seven years of planning and 70,000 volunteers to make everything go 
                 well. Many people have said that the organisation was not as perfect as that of the Beijing Games, but there 
                 was a much better atmosphere which spread out through the whole city. The volunteers were always friendly and 
                 helpful and Londoners even began talking to each other, and visitors, on the underground trains!\n"""
            self.load_config()
            self.initialize_model()
            self.segments = self.segment_text(self.full_text)
            self.sliding_sequences = self.get_sliding_sequences(self.segments)
            return jsonify({'message': f'Sample set successfully', 'content': self.full_text}), 200
        except Exception as e:
            return jsonify({'message': 'Failed to set sample', 'error': str(e)}), 500

    def get_quiz(self):
        json_dict = {}
        print("Sliding sequences: ")
        print(self.sliding_sequences)

        random_index = random.randrange(len(self.sliding_sequences))
        selected_item = self.sliding_sequences.pop(random_index)
        print(selected_item)
        quiz = self.model.generate(pdf_text=selected_item, system_prompt=self.prompt, temperature=0.5)
        try:
            new_question = re.search(r'<Question>(.*?)(</Question>|<Question>)', quiz, re.DOTALL).group(1)
            print(new_question)
            new_question_embeddings = self.get_embeddings(new_question)
            if self.model.question_embeddings is None:
                self.model.question_embeddings = np.vstack([new_question_embeddings])
                self.generated_questions[new_question] = re.search(r'(<Option 1>(.*?)</Explanation 4>)', quiz,
                                                              re.DOTALL).group(
                    1)
                json_dict = get_json(quiz)
            else:
                print("Checking similarity")
                if self.check_similarity(new_question_embeddings, self.model.question_embeddings, threshold=0.7):
                    self.model.question_embeddings = np.vstack([new_question_embeddings])
                    self.generated_questions[new_question] = re.search(r'(<Option 1>(.*?)</Explanation 4>)', quiz,
                                                                  re.DOTALL).group(1)

                    print("not similar")
                    json_dict = get_json(quiz)
                else:
                    print("similar")
                    print("Question <" + new_question + "> rejected")
        except Exception as e:
            print("Quiz generation failed :" + str(e))

        return jsonify(json_dict)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
processor = PDFProcessor()
app.config['UPLOAD_FOLDER'] = processor.upload_folder
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


@app.route('/upload', methods=['POST'])
@cross_origin(origin='http://localhost:3000', headers=['Content-Type', 'Authorization'])
def upload_file():
    return processor.upload_file()


@app.route('/set-sample', methods=['POST'])
@cross_origin(origin='http://localhost:3000', headers=['Content-Type', 'Authorization'])
def set_sample_text():
    return processor.get_sample_text()


@app.route('/get-quiz', methods=['GET'])
@cross_origin(origin='http://localhost:3000', headers=['Content-Type', 'Authorization'])
def get_quiz():
    return processor.get_quiz()


if __name__ == '__main__':
    app.run()

