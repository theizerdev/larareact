import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const modules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
    ],
};

const formats = ['bold', 'italic', 'underline', 'list'];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value = '',
    onChange,
    placeholder = 'Escriba aquí...',
    className = '',
}) => {
    return (
        <div className={`rich-text-editor-container ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={(content) => {
                    const cleaned = content === '<p><br></p>' ? '' : content;
                    if (onChange) {
                        onChange(cleaned);
                    }
                }}
                placeholder={placeholder}
                modules={modules}
                formats={formats}
            />
        </div>
    );
};

export default RichTextEditor;
