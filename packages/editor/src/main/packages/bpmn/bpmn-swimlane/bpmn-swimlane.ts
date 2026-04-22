import { BPMNElementType } from '..';
import { UMLElementType } from '../../uml-element-type';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { UMLContainer } from '../../../services/uml-container/uml-container';

export class BPMNSwimlane extends UMLContainer {
  static DEFAULT_HEIGHT = 80;
  static MIN_WIDTH = 80;
  static MIN_HEIGHT = 80;
  static LANE_NAME_HEADER = 30;
  static LANE_PADDING = 10;

  static features: UMLElementFeatures = {
    ...UMLElement.features,
    droppable: true,
    movable: false,
    connectable: false,
    updatable: false,
    resizable: 'HEIGHT',
  };

  type: UMLElementType = BPMNElementType.BPMNSwimlane;

  // Published for the pool to read each frame. Must not be confused with
  // this.bounds.width, which the pool owns (P3).
  contentRequiredWidth: number = BPMNSwimlane.MIN_WIDTH;

  // Runtime-only (not serialized). The user's manual-drag height floor.
  // 0 means the user hasn't manually resized yet.
  private userMinHeight: number = 0;
  // Runtime-only. The height we produced on the previous render. Used to detect
  // manual drag by comparing the current bounds.height against it.
  private lastRenderedHeight: number = 0;

  render(layer: ILayer, children: ILayoutable[] = []): ILayoutable[] {
    // Width is pool-driven (P3). Keep a MIN_WIDTH safety net for the first frame
    // before the pool has had a chance to set it.
    if (this.bounds.width < BPMNSwimlane.MIN_WIDTH) {
      this.bounds.width = BPMNSwimlane.MIN_WIDTH;
    }

    const header = BPMNSwimlane.LANE_NAME_HEADER;
    const padding = BPMNSwimlane.LANE_PADDING;
    const minX = header + padding;
    const laneWidth = this.bounds.width;

    let requiredHeight = BPMNSwimlane.MIN_HEIGHT;
    let requiredInteriorRight = minX;

    for (const child of children) {
      const bounds = (child as UMLElement).bounds;
      if (!bounds) {
        continue;
      }

      // Left clamp: stay clear of the rotated lane name + left padding.
      if (bounds.x < minX) {
        bounds.x = minX;
      }
      // Right clamp: push the child left so it doesn't overflow the lane.
      // If the child is wider than the interior, it stays at minX; the pool
      // is prevented from shrinking into overflow by the pool-width floor.
      const maxX = laneWidth - padding - bounds.width;
      if (bounds.x > maxX) {
        bounds.x = Math.max(minX, maxX);
      }
      // Top clamp: padding from the lane origin.
      if (bounds.y < padding) {
        bounds.y = padding;
      }

      requiredHeight = Math.max(requiredHeight, bounds.y + bounds.height + padding);
      requiredInteriorRight = Math.max(requiredInteriorRight, bounds.x + bounds.width + padding);
    }

    // Detect a manual drag: if bounds.height changed since our last render,
    // the user moved the resize handle. Capture it as userMinHeight.
    if (this.lastRenderedHeight > 0 && Math.abs(this.bounds.height - this.lastRenderedHeight) > 0.5) {
      this.userMinHeight = this.bounds.height;
    }

    // Height = max of content-required, user's manual floor, and MIN_HEIGHT.
    const finalHeight = Math.max(requiredHeight, this.userMinHeight, BPMNSwimlane.MIN_HEIGHT);
    this.bounds.height = finalHeight;
    this.lastRenderedHeight = finalHeight;

    // Publish content-required width for the pool (D2). NOT a bounds write.
    this.contentRequiredWidth = Math.max(BPMNSwimlane.MIN_WIDTH, requiredInteriorRight);

    return [this, ...children];
  }
}
