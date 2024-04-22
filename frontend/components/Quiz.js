import React, {useEffect, useState} from "react";

function Quiz({ text }) {
    const [question, setQuestion] = useState("");
    const [option1, setOption1] = useState("");
    const [option2, setOption2] = useState("");
    const [option3, setOption3] = useState("");
    const [option4, setOption4] = useState("");
    const [explanation1, setExplanation1] = useState("");
    const [explanation2, setExplanation2] = useState("");
    const [explanation3, setExplanation3] = useState("");
    const [explanation4, setExplanation4] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");
    const [feedback, setFeedback] = useState("");
    const [correctCount, setCorrectCount] = useState(0);
    const [checkAnswerDisabled, setCheckAnswerDisabled] = useState(true);
    const [generateDisabled, setGenerateDisabled] = useState(true);
    const [ifCorrect, setIfCorrect] = useState(false);

    useEffect(() => {
        if (text !== "Please upload a PDF first...") {
            setGenerateDisabled(false);
        }
    }, [text]);

    useEffect(() => {
        setIsLoading(false);
    }, [question]);

    const fetchQuiz = async (attempts) => {
        setIsLoading(true);
        try {
            const response = await fetch('https://yenyena.pythonanywhere.com/get-quiz');
            const data = await response.json();
            if (!response.ok) throw new Error('Network response was not ok.');
            if (!data.question) throw new Error('Empty response data.');
            setQuestion(data.question);
            setOption1(data.option1);
            setOption2(data.option2);
            setOption3(data.option3);
            setOption4(data.option4);
            setExplanation1(data.explanation1);
            setExplanation2(data.explanation2);
            setExplanation3(data.explanation3);
            setExplanation4(data.explanation4);
            setErrorMessage("");
            setSelectedOption("");
        } catch (error) {
            if (attempts > 1) {
                fetchQuiz(attempts - 1); // Retry the request
            } else {
                console.error('Error:', error);
                setErrorMessage('Failed to generate more questions. Try a different PDF.');
            }
        }
    };

    const handleGenerateQuiz = () => {
        fetchQuiz(3);
        setIfCorrect(false);
        setCheckAnswerDisabled(false);
        setFeedback("");
    }

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    };

    const checkAnswer = () => {
        switch (selectedOption) {
            case "1":
                if (!explanation1.toLowerCase().includes("incorrect")) {
                    setCorrectCount(current => current + 1);
                    setIfCorrect(true);
                }
                setFeedback(explanation1);
                setCheckAnswerDisabled(true);
                break;
            case "2":
                if (!explanation2.toLowerCase().includes("incorrect")) {
                    setCorrectCount(current => current + 1);
                    setIfCorrect(true);
                }
                setFeedback(explanation2);
                setCheckAnswerDisabled(true);
                break;
            case "3":
                if (!explanation3.toLowerCase().includes("incorrect")) {
                    setCorrectCount(current => current + 1);
                    setIfCorrect(true);
                }
                setFeedback(explanation3);
                setCheckAnswerDisabled(true);
                break;
            case "4":
                if (!explanation4.toLowerCase().includes("incorrect")) {
                    setCorrectCount(current => current + 1);
                    setIfCorrect(true);
                }
                setFeedback(explanation4);
                setCheckAnswerDisabled(true);
                break;
            case "":
                setFeedback("You have to select an answer.");
                break;
            default:
                setFeedback("Something went wrong...")
                break;
        }
    }

    return (
        <div className="quiz-div">
            <div className="quiz-header">
                <button className="btn" disabled={generateDisabled} onClick={handleGenerateQuiz}>generate new question</button>
                <p style={{color: generateDisabled ? '#666666' : '#000'}}>correct answers: {correctCount}</p>
            </div>
            <div className="quiz-body">
                {isLoading ? (
                    <div>Loading...</div>
                ) : question && (
                    <>
                        <p className="quiz-question">{question}</p>
                        <div className="quiz-options" onChange={handleOptionChange}>
                            <div className="quiz-option">
                                <input
                                type="radio"
                                name="options"
                                value="1"
                                className="quiz-option"
                                /> {option1}
                            </div>
                            <div className="quiz-option">
                                <input
                                    type="radio"
                                    name="options"
                                    value="2"
                                    className="quiz-option"
                                /> {option2}
                            </div>
                            <div className="quiz-option">
                                <input
                                    type="radio"
                                    name="options"
                                    value="3"
                                    className="quiz-option"
                                /> {option3}
                            </div>
                            <div className="quiz-option">
                                <input
                                    type="radio"
                                    name="options"
                                    value="4"
                                    className="quiz-option"
                                /> {option4}
                            </div>
                        </div>
                        <div className="quiz-finish-body">
                            <button className="btn" onClick={checkAnswer} disabled={checkAnswerDisabled}>check answer</button>
                            {feedback && <div className="feedback" style={{color: ifCorrect ? '#1a9e55' : '#cd0c15'}}>{feedback}</div>}
                        </div>
                    </>
                )}
                {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}
            </div>
        </div>
    )
}

export default Quiz;