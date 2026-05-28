import React from 'react';
import { Code2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GENERATOR_MENU_CONFIG, GeneratorMenuEntry } from './generator-menu-config';
import type { GeneratorMenuMode, GeneratorType } from '../workspace-types';
import type { SupportedDiagramType } from '../../../shared/types/project';

interface GenerateMenuProps {
  mode: GeneratorMenuMode;
  isGenerating: boolean;
  primaryGenerateClass: string;
  activeDiagramType: SupportedDiagramType;
  onGenerate: (type: GeneratorType) => void;
  onSwitchDiagramType?: (type: SupportedDiagramType) => void;
  onDeriveComponentDiagram?: () => void;
  onDeriveDeploymentDiagram?: () => void;
}

const renderGeneratorMenuEntry = (entry: GeneratorMenuEntry, onGenerate: (type: GeneratorType) => void) => {
  if (entry.kind === 'group') {
    return (
      <DropdownMenuSub key={entry.label}>
        <DropdownMenuSubTrigger>{entry.label}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {entry.actions.map((action) => (
            <DropdownMenuItem key={action.generator} onClick={() => onGenerate(action.generator)}>
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  if (entry.kind === 'notice') {
    return (
      <DropdownMenuItem key={entry.label} disabled>
        {entry.label}
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem key={entry.generator} onClick={() => onGenerate(entry.generator)}>
      {entry.label}
    </DropdownMenuItem>
  );
};

export const GenerateMenu: React.FC<GenerateMenuProps> = ({
  mode,
  isGenerating,
  primaryGenerateClass,
  activeDiagramType,
  onGenerate,
  onSwitchDiagramType,
  onDeriveComponentDiagram,
  onDeriveDeploymentDiagram,
}) => {
  const menuEntries = GENERATOR_MENU_CONFIG[mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={primaryGenerateClass} disabled={isGenerating} title="Generate">
          <Code2 className="size-4" />
          <span className="hidden xl:inline">{isGenerating ? 'Generating...' : 'Generate'}</span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel>Code Generation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuEntries.map((entry) => renderGeneratorMenuEntry(entry, onGenerate))}
        {mode === 'statemachine' && onSwitchDiagramType && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSwitchDiagramType('ClassDiagram')}>Go to Class Diagram</DropdownMenuItem>
          </>
        )}
        {activeDiagramType === 'BPMN' && onDeriveComponentDiagram && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDeriveComponentDiagram}>Generate Component diagram</DropdownMenuItem>
          </>
        )}
        {activeDiagramType === 'ComponentDiagram' && onDeriveDeploymentDiagram && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDeriveDeploymentDiagram}>Generate Deployment diagram</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
