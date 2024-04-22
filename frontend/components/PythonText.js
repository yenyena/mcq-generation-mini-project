import React from 'react';

function TextComponent({ text }) {
    const paragraphs = text.split('\n').map((para, index) => (
        <p key={index}>{para}</p>
    ));

    return (
    <div className="text-body">
        <div className="paragraphs">
            {paragraphs.map(para =>
                <p>{para}</p>
            )}
        </div>
    </div>
    )}

export default TextComponent;
