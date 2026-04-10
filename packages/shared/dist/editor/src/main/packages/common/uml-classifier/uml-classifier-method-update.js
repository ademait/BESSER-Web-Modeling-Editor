import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { StylePane } from '../../../components/style-pane/style-pane';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/python/python';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
`;
const MethodRow = styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
`;
const ControlsRow = styled.div `
  display: flex;
  align-items: center;
  gap: 4px;
`;
const VisibilityDropdown = styled(Dropdown) `
  min-width: 80px;
  flex-shrink: 0;
`;
const NameField = styled(Textfield) `
  flex: 1;
  min-width: 0;
`;
const CodeButton = styled(Button) `
  padding: 4px 8px;
  font-size: 12px;
  min-width: 60px;
`;
const MethodNameLabel = styled.span `
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 13px;
  color: ${(props) => props.theme.color.primary || '#007bff'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const CodeEditorWrapper = styled.div `
  margin-top: 8px;
  border: 1px solid ${(props) => props.theme.color.gray};
  border-radius: 4px;
  overflow: hidden;
`;
const ResizableCodeMirrorWrapper = styled.div `
  resize: both;
  overflow: auto;
  min-height: 150px;
  max-height: 400px;
  box-sizing: border-box;

  .CodeMirror {
    height: 100% !important;
    width: 100%;
    min-height: 150px;
  }
`;
const CodeEditorHeader = styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: ${(props) => props.theme.color.grayLight || '#f5f5f5'};
  border-bottom: 1px solid ${(props) => props.theme.color.gray};
`;
const CodeEditorTitle = styled.span `
  font-weight: bold;
  font-size: 12px;
`;
const VISIBILITY_OPTIONS = [
    { symbol: '+', value: 'public', label: '+' },
    { symbol: '-', value: 'private', label: '-' },
    { symbol: '#', value: 'protected', label: '#' },
    { symbol: '~', value: 'package', label: '~' },
];
const UmlMethodUpdate = ({ id, onRefChange, value, code, onChange, onSubmitKeyUp, onDelete, element }) => {
    const [colorOpen, setColorOpen] = useState(false);
    const [codeEditorOpen, setCodeEditorOpen] = useState(code ? true : false); // Auto-open if code exists
    const [localCode, setLocalCode] = useState(code || '');
    const toggleColor = () => {
        setColorOpen(!colorOpen);
    };
    const toggleCodeEditor = () => {
        if (!codeEditorOpen) {
            // Opening the code editor
            if (!localCode) {
                // Initialize with a template when opening for the first time
                const methodName = parseMethod(value).name || 'method_name';
                // Extract just the method name without parameters for the template
                const cleanMethodName = methodName.split('(')[0].trim() || 'new_method';
                const template = `def ${cleanMethodName}(self):\n    """Add your docstring here."""\n    # Add your implementation here\n    pass\n`;
                setLocalCode(template);
                onChange(id, { code: template });
            }
        }
        setCodeEditorOpen(!codeEditorOpen);
    };
    const clearCode = () => {
        setLocalCode('');
        onChange(id, { code: '' });
        setCodeEditorOpen(false);
    };
    // Parse the method string: visibility name(params): returnType
    const parseMethod = (methodString) => {
        const trimmed = methodString.trim();
        let visibility = '+'; // default
        let name = '';
        // Check for visibility symbol at the start
        const visibilityMatch = trimmed.match(/^([+\-#~])\s*/);
        if (visibilityMatch) {
            visibility = visibilityMatch[1];
            name = trimmed.substring(visibilityMatch[0].length);
        }
        else {
            name = trimmed;
        }
        return { visibility, name };
    };
    const { visibility, name } = parseMethod(value);
    const handleVisibilityChange = (newVisibility) => {
        const visSymbol = VISIBILITY_OPTIONS.find(v => v.value === newVisibility)?.symbol || '+';
        const newValue = `${visSymbol} ${name}`;
        onChange(id, { name: newValue });
    };
    const handleNameChange = (newName) => {
        const nameStr = String(newName);
        const visSymbol = VISIBILITY_OPTIONS.find(v => v.value === visibility)?.symbol || visibility;
        const newValue = `${visSymbol} ${nameStr}`;
        onChange(id, { name: newValue });
    };
    const handleCodeChange = (editor, data, newCode) => {
        setLocalCode(newCode);
        // Extract method name from Python code
        const methodMatch = newCode.match(/def\s+(\w+)\s*\([^)]*\)/);
        if (methodMatch && methodMatch[1]) {
            const extractedMethodName = methodMatch[1];
            // Extract return type if exists
            const returnTypeMatch = newCode.match(/def\s+\w+\s*\([^)]*\)\s*->\s*([^:]+):/);
            const returnType = returnTypeMatch ? returnTypeMatch[1].trim() : '';
            // Extract parameters
            const paramsMatch = newCode.match(/def\s+\w+\s*\(([^)]*)\)/);
            let params = '';
            if (paramsMatch && paramsMatch[1]) {
                // Remove 'self' and clean up parameters
                const paramList = paramsMatch[1].split(',')
                    .map(p => p.trim())
                    .filter(p => p && p !== 'self');
                params = paramList.length > 0 ? paramList.join(', ') : '';
            }
            // Build the method signature for display
            const visSymbol = VISIBILITY_OPTIONS.find(v => v.value === visibility)?.symbol || '+';
            let signature = `${visSymbol} ${extractedMethodName}`;
            if (params || returnType) {
                signature += `(${params})`;
                if (returnType) {
                    signature += `: ${returnType}`;
                }
            }
            else {
                signature += '()';
            }
            // Update both code and name
            onChange(id, { code: newCode, name: signature });
        }
        else {
            // No valid method found, just update code
            onChange(id, { code: newCode });
        }
    };
    const handleDelete = () => {
        onDelete(id)();
    };
    const visibilityValue = VISIBILITY_OPTIONS.find(v => v.symbol === visibility)?.value || 'public';
    const hasCode = localCode && localCode.trim().length > 0;
    return (React.createElement(MethodRow, null,
        React.createElement(ControlsRow, null,
            !hasCode && (React.createElement(React.Fragment, null,
                React.createElement(VisibilityDropdown, { value: visibilityValue, onChange: handleVisibilityChange }, VISIBILITY_OPTIONS.map(vis => (React.createElement(Dropdown.Item, { key: vis.value, value: vis.value }, vis.label)))),
                React.createElement(NameField, { ref: onRefChange, value: name, onChange: handleNameChange, onSubmitKeyUp: onSubmitKeyUp, placeholder: "method(param: type): returnType or click Code \u2192" }))),
            hasCode && (React.createElement(MethodNameLabel, { title: "Method defined in code below" },
                "\uD83D\uDCDD ",
                name.split('(')[0] || 'method',
                " (Python code)")),
            React.createElement(CodeButton, { color: hasCode ? "primary" : "link", onClick: toggleCodeEditor, title: hasCode ? "Edit Python code" : "Write Python implementation" }, codeEditorOpen ? '▼ Code' : '▶ Code'),
            React.createElement(ColorButton, { onClick: toggleColor }),
            React.createElement(Button, { color: "link", tabIndex: -1, onClick: handleDelete },
                React.createElement(TrashIcon, null))),
        codeEditorOpen && (React.createElement(CodeEditorWrapper, null,
            React.createElement(CodeEditorHeader, null,
                React.createElement(CodeEditorTitle, null, "Python Implementation (full method definition)"),
                React.createElement("div", null,
                    hasCode && (React.createElement(Button, { color: "link", onClick: clearCode, style: { padding: '2px 6px', fontSize: '10px', marginRight: '4px' } }, "Clear Code")),
                    React.createElement(Button, { color: "link", onClick: toggleCodeEditor, style: { padding: '2px 6px', fontSize: '10px' } }, "Close"))),
            React.createElement(ResizableCodeMirrorWrapper, null,
                React.createElement(CodeMirror, { value: localCode, options: {
                        mode: 'python',
                        theme: 'material',
                        lineNumbers: true,
                        tabSize: 4,
                        indentWithTabs: false,
                        indentUnit: 4,
                    }, onBeforeChange: (editor, data, value) => {
                        setLocalCode(value);
                    }, onChange: handleCodeChange })))),
        React.createElement(StylePane, { open: colorOpen, element: element, onColorChange: onChange, fillColor: true, textColor: true })));
};
export default UmlMethodUpdate;
//# sourceMappingURL=uml-classifier-method-update.js.map