import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { StylePane } from '../../../components/style-pane/style-pane';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
`;
const AttributeRow = styled.div `
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
const TypeDropdown = styled(Dropdown) `
  min-width: 100px;
  flex-shrink: 0;
`;
const NameField = styled(Textfield) `
  flex: 1;
  min-width: 0;
`;
const PRIMITIVE_TYPES = [
    { value: 'str', label: 'str (string)' },
    { value: 'int', label: 'int (integer)' },
    { value: 'float', label: 'float (double)' },
    { value: 'bool', label: 'bool (boolean)' },
    { value: 'date', label: 'date' },
    { value: 'datetime', label: 'datetime' },
    { value: 'time', label: 'time' },
    { value: 'timedelta', label: 'timedelta' },
    { value: 'any', label: 'any' },
];
// Type alias mapping for normalizing types from various sources (agent responses, imports, etc.)
const TYPE_ALIASES = {
    // String variants
    'string': 'str',
    'String': 'str',
    'STRING': 'str',
    // Integer variants
    'integer': 'int',
    'Integer': 'int',
    'INTEGER': 'int',
    'long': 'int',
    'Long': 'int',
    // Float/Double variants
    'double': 'float',
    'Double': 'float',
    'DOUBLE': 'float',
    'Float': 'float',
    'FLOAT': 'float',
    'number': 'float',
    'Number': 'float',
    'decimal': 'float',
    'Decimal': 'float',
    // Boolean variants
    'boolean': 'bool',
    'Boolean': 'bool',
    'BOOLEAN': 'bool',
    // Date variants
    'Date': 'date',
    'DATE': 'date',
    // DateTime variants
    'DateTime': 'datetime',
    'DATETIME': 'datetime',
    'Timestamp': 'datetime',
    'timestamp': 'datetime',
    // Time variants
    'Time': 'time',
    'TIME': 'time',
    // Any variants
    'object': 'any',
    'Object': 'any',
    'void': 'any',
    'Void': 'any',
};
// Normalize a type string to the canonical Python-style type
const normalizeType = (type) => {
    if (!type)
        return 'str';
    const trimmed = type.trim();
    return TYPE_ALIASES[trimmed] || trimmed;
};
const VISIBILITY_OPTIONS = [
    { symbol: '+', value: 'public', label: '+' },
    { symbol: '-', value: 'private', label: '-' },
    { symbol: '#', value: 'protected', label: '#' },
    { symbol: '~', value: 'package', label: '~' },
];
// Helper function to parse legacy name format for backward compatibility
const parseLegacyName = (nameValue) => {
    const trimmed = nameValue.trim();
    let visibility = 'public';
    let parsedName = '';
    let attributeType = 'str';
    const visibilityMatch = trimmed.match(/^([+\-#~])\s*/);
    if (visibilityMatch) {
        const symbolToVis = { '+': 'public', '-': 'private', '#': 'protected', '~': 'package' };
        visibility = symbolToVis[visibilityMatch[1]] || 'public';
        const afterVisibility = trimmed.substring(visibilityMatch[0].length);
        const typeMatch = afterVisibility.match(/^([^:]+):\s*(.+)$/);
        if (typeMatch) {
            parsedName = typeMatch[1].trim();
            attributeType = normalizeType(typeMatch[2].trim());
        }
        else {
            parsedName = afterVisibility.trim();
        }
    }
    else {
        const typeMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
        if (typeMatch) {
            parsedName = typeMatch[1].trim();
            attributeType = normalizeType(typeMatch[2].trim());
        }
        else {
            parsedName = trimmed;
        }
    }
    return { visibility, name: parsedName, attributeType };
};
const UmlAttributeUpdate = ({ id, onRefChange, value, visibility: propVisibility, attributeType: propAttributeType, onChange, onSubmitKeyUp, onDelete, element, isEnumeration = false, availableEnumerations = [] }) => {
    const [colorOpen, setColorOpen] = useState(false);
    const toggleColor = () => {
        setColorOpen(!colorOpen);
    };
    // For enumerations, just use the value as-is (it's a literal name)
    if (isEnumeration) {
        const handleNameChange = (newName) => {
            const nameStr = String(newName);
            onChange(id, { name: nameStr });
        };
        const handleDelete = () => {
            onDelete(id)();
        };
        return (React.createElement(AttributeRow, null,
            React.createElement(ControlsRow, null,
                React.createElement(NameField, { ref: onRefChange, value: value, onChange: handleNameChange, onSubmitKeyUp: onSubmitKeyUp, placeholder: "literal name" }),
                React.createElement(ColorButton, { onClick: toggleColor }),
                React.createElement(Button, { color: "link", tabIndex: -1, onClick: handleDelete },
                    React.createElement(TrashIcon, null))),
            React.createElement(StylePane, { open: colorOpen, element: element, onColorChange: onChange, fillColor: true, textColor: true })));
    }
    // Determine values: use separate properties if available, otherwise parse from value (backward compatibility)
    let visibility;
    let attrName;
    let attributeType;
    if (propVisibility !== undefined && propAttributeType !== undefined) {
        // New format - use separate properties, value is the actual name
        visibility = propVisibility;
        attrName = value;
        attributeType = propAttributeType;
    }
    else {
        // Legacy format - parse from value
        const parsed = parseLegacyName(value);
        visibility = parsed.visibility;
        attrName = parsed.name;
        attributeType = parsed.attributeType;
    }
    // Get available enumerations from the model
    const enumerations = availableEnumerations;
    const allTypes = [...PRIMITIVE_TYPES, ...enumerations];
    const handleVisibilityChange = (newVisibility) => {
        const vis = newVisibility;
        onChange(id, {
            name: attrName,
            visibility: vis,
            attributeType
        });
    };
    const handleNameChange = (newName) => {
        const nameStr = String(newName);
        onChange(id, {
            name: nameStr,
            visibility,
            attributeType
        });
    };
    const handleTypeChange = (newType) => {
        const typeStr = String(newType);
        onChange(id, {
            name: attrName,
            visibility,
            attributeType: typeStr
        });
    };
    const handleDelete = () => {
        onDelete(id)();
    };
    return (React.createElement(AttributeRow, null,
        React.createElement(ControlsRow, null,
            React.createElement(VisibilityDropdown, { value: visibility, onChange: handleVisibilityChange }, VISIBILITY_OPTIONS.map(vis => (React.createElement(Dropdown.Item, { key: vis.value, value: vis.value }, vis.label)))),
            React.createElement(NameField, { ref: onRefChange, value: attrName, onChange: handleNameChange, onSubmitKeyUp: onSubmitKeyUp, placeholder: "attribute name" }),
            React.createElement(TypeDropdown, { value: attributeType, onChange: handleTypeChange }, allTypes.map(t => (React.createElement(Dropdown.Item, { key: t.value, value: t.value }, t.label)))),
            React.createElement(ColorButton, { onClick: toggleColor }),
            React.createElement(Button, { color: "link", tabIndex: -1, onClick: handleDelete },
                React.createElement(TrashIcon, null))),
        React.createElement(StylePane, { open: colorOpen, element: element, onColorChange: onChange, fillColor: true, textColor: true })));
};
;
export default UmlAttributeUpdate;
//# sourceMappingURL=uml-classifier-attribute-update.js.map