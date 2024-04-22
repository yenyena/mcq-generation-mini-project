import './App.css';
import PdfUploader from "./components/PdfUploader";
import Quiz from "./components/Quiz";
import React, {useEffect, useState} from 'react';
import PythonText from "./components/PythonText";
import Modal from "./components/Modal";
import MobileOverlay from "./components/MobileOverlay";

function App() {
    const [text, setText] = useState("Please upload a PDF first...");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 900)
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, []);

    const handleTextChange = (newText) => {
        setText(newText);
    };

    const toggleModal = () => setIsModalOpen(!isModalOpen);

    return (
        <div className="App">
            {isMobile && <MobileOverlay />}
            <Modal isOpen={isModalOpen} close={toggleModal} />
            <div className="App-header">
                <p className="heading">/<span className="ast">*</span> elice AI engineer mini project <span
                    className="ast">*</span>/</p>
                <div className="header-right">
                    <div className="upload-button">
                        <PdfUploader onTextChange={handleTextChange} />
                    </div>
                    <div onClick={toggleModal} className="info-circle">i</div>
                </div>
            </div>
            <div className="app-body">
                <PythonText text={text} />
                <Quiz text={text} />
            </div>
        </div>
        );
    }

export default App;
