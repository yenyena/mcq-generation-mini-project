import React, { useState, useRef, useEffect } from 'react';

function PdfUploader({ onTextChange }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const formRef = useRef(null);
  const [uploadDisabled, setUploadDisabled] = useState(false);

  useEffect(() => {
    formRef.current.click();
  }, [file]);

  const handleFileChange = (event) => {
    console.log("changing");
    setFile(event.target.files[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("submitting");
    if (file) {
      console.log('Uploading:', file.name);
      // send to backend
      let formData = new FormData();
      formData.append('file', file);
      console.log("Form data: " + formData)

      fetch("https://yenyena.pythonanywhere.com/upload", {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setUploadStatus(data.message);
        if (data.content) {
          onTextChange(data.content)
          setUploadDisabled(true);
          console.log(data.content)
        }
      })
      .catch(error => {
        console.log("Error: ", error);
        setUploadStatus("Failed to upload and read the file.");
      });
    } else {
      console.log('No file selected.');
    }
    console.log(uploadStatus)
  };

  const uploadSample = () => {
    const sampleString = "An Olympic blog\n" +
        "What an Olympics!\n" +
        "Posted by Helen Nolan on 10 September, 2012 at 21:25\n" +
        "It’s all over! I’ve been writing my blog from London every day during the Olympics and the Paralympics and this is my final post to look back on a wonderful couple of months. Here are some of the things that were the most memorable for me:\n" +
        "The Opening Ceremony\n" +
        "This set the scene for the Games with an amazing show featuring music, dancing, historical figures, fireworks and British humour. A huge number of volunteers practised for months to make everything perfect. The best moment was when the old lady in Buckingham Palace turned round and showed that she was neither a lookalike nor an actor but Her Majesty the Queen. The next best bit was when she jumped out of a helicopter with James Bond (although I think that actually was an actor!).\n" +
        "Team GB\n" +
        "I was very proud of our team as we kept on winning medals and finished in third position in the medal table, which is truly a great result for Great Britain. There were so many incredible sportsmen and women. The ones that stand out for me are Mo Farah, the Somalian-born Londoner who won the 10,000 and 5,000 metres with the whole stadium going crazy, Jessica Ennis, the popular super-athlete from Sheffield who won the heptathlon, and Nicola Adams who won the first female boxing medal in Olympic history for Britain.\n" +
        "The Olympic Stadium crowd\n" +
        "Although the crowd cheered on the British, there was lots of support for athletes of other nationalities too like the wonderful Usain Bolt, from Jamaica, who won the 100 and 200 metres sprint to become the fastest man alive. There was also Oscar Pistorius of South Africa who was the first disabled person to compete in the Olympics. He went on to win two gold medals and a silver in the Paralympics.\n" +
        "\n" +
        "New sports\n" +
        "I have really enjoyed being able to watch sports which are not normally shown on television. Before the Olympics I didn’t expect to love watching judo or find myself screaming at the television during a game of wheelchair tennis, but I really got into them. I didn’t know anything about goalball before the Paralympics but it became one of my favourite sports.\n" +
        "The organisation and the atmosphere\n" +
        "It took seven years of planning and 70,000 volunteers to make everything go well. Many people have said that the organisation was not as perfect as that of the Beijing Games, but there was a much better atmosphere which spread out through the whole city. The volunteers were always friendly and helpful and Londoners even began talking to each other, and visitors, on the underground trains!\n"
    console.log("setting sample")
    fetch("https://yenyena.pythonanywhere.com/set-sample", {
        method: 'POST',
        body: sampleString,
      })
      .then(response => response.json())
      .then(data => {
        setUploadStatus(data.message);
        onTextChange(sampleString)
        setUploadDisabled(true);
        console.log("sample set")
      })
      .catch(error => {
        console.log("Error: ", error);
        setUploadStatus("Failed to read the sample.");
      });
    }

  return (
    <div className="upload-btns">
      <form onSubmit={handleSubmit}>
        <label htmlFor="file-upload" className={`btn ${uploadDisabled ? "upload-disabled" : "upload-allowed"}`}>
          upload pdf
        </label>
        <input id="file-upload" type="file" accept="application/pdf" onChange={handleFileChange}
               disabled={uploadDisabled}/>
        <button ref={formRef} className="submit-btn" type="submit">upload pdf</button>
      </form>
      <button className={`btn header-btn ${uploadDisabled ? "upload-disabled" : "upload-allowed"}`} onClick={uploadSample}>
        try with sample
      </button>
    </div>
  );
}

export default PdfUploader;
