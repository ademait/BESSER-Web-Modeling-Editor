import { describe, it, expect } from 'vitest';
import { UMLComponentComponent } from '../../../../../../editor/src/main/packages/uml-component-diagram/uml-component/uml-component-component';
import { UMLDeploymentComponent } from '../../../../../../editor/src/main/packages/uml-deployment-diagram/uml-deployment-component/uml-component';

/**
 * Regression guard for 02-construct-gaps-phase-a-guide.md § 2.2 / § 2.3.
 *
 * Before Phase A, UMLComponentComponent.serialize() and
 * UMLDeploymentComponent.serialize() emitted only `displayStereotype`
 * and silently dropped `stereotype`. These tests fail if that
 * round-trip ever regresses.
 */
describe('Phase A — Component/Deployment stereotype survives serialize round-trip', () => {
  it('UMLComponentComponent.serialize() emits the stereotype', () => {
    const component = new UMLComponentComponent({
      name: 'Planner',
      stereotype: 'solution',
      displayStereotype: true,
    });

    const serialized = component.serialize();

    expect(serialized.stereotype).toBe('solution');
    expect(serialized.displayStereotype).toBe(true);
  });

  it('UMLComponentComponent.deserialize() restores the stereotype', () => {
    const original = new UMLComponentComponent({
      name: 'Planner',
      stereotype: 'solution',
      displayStereotype: true,
    });

    const restored = new UMLComponentComponent();
    restored.deserialize(original.serialize());

    expect(restored.stereotype).toBe('solution');
    expect(restored.displayStereotype).toBe(true);
  });

  it('UMLDeploymentComponent.serialize() emits the stereotype', () => {
    const component = new UMLDeploymentComponent({
      name: 'EdgeRuntime',
      stereotype: 'local',
      displayStereotype: true,
    });

    const serialized = component.serialize();

    expect(serialized.stereotype).toBe('local');
    expect(serialized.displayStereotype).toBe(true);
  });

  it('UMLDeploymentComponent.deserialize() restores the stereotype', () => {
    const original = new UMLDeploymentComponent({
      name: 'EdgeRuntime',
      stereotype: 'local',
      displayStereotype: true,
    });

    const restored = new UMLDeploymentComponent();
    restored.deserialize(original.serialize());

    expect(restored.stereotype).toBe('local');
    expect(restored.displayStereotype).toBe(true);
  });

  it('a full serialize → deserialize cycle preserves whatever the default stereotype is', () => {
    // Guards against a regression where the default stereotype value
    // ('component') is dropped when the user never edits the field.
    const original = new UMLComponentComponent({ name: 'Plain' });
    const restored = new UMLComponentComponent();
    restored.deserialize(original.serialize());

    expect(restored.stereotype).toBe(original.stereotype);
  });
});
