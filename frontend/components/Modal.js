import React from 'react';

const Modal = ({ isOpen, close }) => {
  if (!isOpen) return null;

  return (
        <div className="modal-overlay" onClick={close}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={close}>X</button>
                <p>
                    This website was built to showcase the mini-project completed as a part of the hiring process for
                    the AI Engineer position in Elice.
                </p>
                <p>
                    This showcase is an extension of the submitted Jupyter notebook. Please refer to the notebook for
                    implementation detail, alternatives, comments and explanations. The only purpose of this is to
                    present the results of the notebook work in a user-friendly, readable manner.
                </p>
                <p>
                    To interact with the model, please upload a PDF or try with the provided sample. After that, the
                    "generate new question" option will become enabled, which will generate one multiple-choice
                    question at a time. The model used for generation is GPT3.5 supported by an open-source model
                    for auxiliary functions such as question similarity checking. The backend of this website is
                    built with Flask, the frontend with React, and the communication between the two is facilitated
                    by RESTful API calls.
                </p>
                <p>
                    The full code for this website, along with the Jupyter notebook, can be found on Github at
                    https://github.com/yenyena/mcq-generation-mini-project. If you have any comments on questions,
                    feel free to reach out to me anytime at adriana.staudova@gmail.com or 010-9545-9828.
                </p>
                <p>
                    Thank you for your time looking over this project and I am looking forward to hearing from you :)
                </p>
            </div>
        </div>
    );
};

export default Modal;
