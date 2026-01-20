import React, { FunctionComponent } from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { LanguageModel } from './language-model';

interface Props {
  element: LanguageModel;
  fillColor?: string;
}

export const LanguageModelComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return (
    <g>
      <ThemedRect
        width="100%"
        height="100%"
        fillColor={fillColor || element.fillColor}
        strokeColor={element.strokeColor}
        rx={3}
        strokeDasharray="5,3"
      />
      <svg height={25}>
        <Text fill={element.textColor} fontWeight="bold">
          {element.name}
        </Text>
      </svg>
      <svg y={28} height={20}>
        <Text fill={element.textColor} fontSize="smaller">
          {`${element.provider} / ${element.model}`}
        </Text>
      </svg>
    </g>
  );
};