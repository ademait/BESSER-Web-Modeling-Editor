import React from 'react';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { IUMLElement } from '../../../services/uml-element/uml-element';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/python/python';
type Props = {
    id: string;
    onRefChange: (instance: Textfield<any>) => void;
    value: string;
    code: string;
    onChange: (id: string, values: {
        name?: string;
        code?: string;
        fillColor?: string;
        textColor?: string;
        lineColor?: string;
    }) => void;
    onSubmitKeyUp: () => void;
    onDelete: (id: string) => () => void;
    element: IUMLElement;
};
declare const UmlMethodUpdate: ({ id, onRefChange, value, code, onChange, onSubmitKeyUp, onDelete, element }: Props) => React.JSX.Element;
export default UmlMethodUpdate;
