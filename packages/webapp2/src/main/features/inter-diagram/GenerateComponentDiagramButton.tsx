import React from 'react';
import { Wand2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { useGenerateComponentDiagram } from './useGenerateComponentDiagram';

interface Props {
  outlineButtonClass: string;
}

export const GenerateComponentDiagramButton: React.FC<Props> = ({ outlineButtonClass }) => {
  const generate = useGenerateComponentDiagram();

  const onClick = async () => {
    const r = await generate();
    if (!r.ok) {
      const msg =
        r.reason === 'no-pools'
          ? 'Add at least one pool with lanes to this BPMN diagram first.'
          : r.reason === 'no-lanes-in-any-pool'
          ? 'Add at least one lane inside a pool first.'
          : 'This action only works on a BPMN diagram.';
      toast.error(`Cannot derive Component diagram: ${msg}`);
      return;
    }
    if (r.warnings.length > 0) {
      toast.warning(
        `Generated Component diagram with ${r.warnings.length} warning${r.warnings.length === 1 ? '' : 's'} — see console.`,
      );
      // eslint-disable-next-line no-console
      console.info('[inter-diagram] derivation warnings:', r.warnings);
    } else {
      toast.success('Component diagram generated — switched to the new diagram.');
    }
  };

  return (
    <Button
      variant="outline"
      className={`gap-1.5 ${outlineButtonClass}`}
      onClick={onClick}
      title="Generate a Component diagram from this BPMN diagram"
      data-cy="inter-diagram-derive-component"
    >
      <Wand2 className="size-4" />
      <span className="hidden xl:inline">Generate Components</span>
    </Button>
  );
};
