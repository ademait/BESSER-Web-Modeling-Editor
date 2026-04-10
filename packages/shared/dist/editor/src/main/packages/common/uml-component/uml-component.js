import { UMLPackage } from '../uml-package/uml-package';
export class UMLComponent extends UMLPackage {
    constructor() {
        super(...arguments);
        this.stereotype = 'component';
        this.displayStereotype = true;
    }
}
//# sourceMappingURL=uml-component.js.map