import React from 'react';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { IUMLElement } from '../../../services/uml-element/uml-element';
import { Visibility } from './uml-classifier-member';
type AttributeValues = {
    name?: string;
    visibility?: Visibility;
    attributeType?: string;
    fillColor?: string;
    textColor?: string;
    lineColor?: string;
};
type Props = {
    id: string;
    onRefChange: (instance: Textfield<any>) => void;
    value: string;
    visibility?: Visibility;
    attributeType?: string;
    onChange: (id: string, values: AttributeValues) => void;
    onSubmitKeyUp: () => void;
    onDelete: (id: string) => () => void;
    element: IUMLElement;
    isEnumeration?: boolean;
    availableEnumerations?: Array<{
        value: string;
        label: string;
    }>;
};
declare const UmlAttributeUpdate: ({ id, onRefChange, value, visibility: propVisibility, attributeType: propAttributeType, onChange, onSubmitKeyUp, onDelete, element, isEnumeration, availableEnumerations }: Props) => React.JSX.Element;
export default UmlAttributeUpdate;
