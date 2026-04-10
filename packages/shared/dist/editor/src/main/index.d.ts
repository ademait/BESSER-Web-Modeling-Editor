/**
 * Main entry point for the BESSER Web Modeling Editor package.
 *
 * This file serves as a "barrel export" that creates a clean, well-organized public API
 * by selectively re-exporting functionality from various internal modules. The goal is to:
 *
 * - Provide a single, convenient entry point for package consumers
 * - Expose only the necessary public API while keeping internal implementation details private
 * - Maintain type safety through TypeScript type exports
 * - Support backward compatibility through compatibility exports
 * - Allow internal refactoring without breaking the public interface
 */
export * from './typings';
export * from './apollon-editor';
export * from './compat/helpers';
export * from './services/diagram-bridge';
export * from './services/settings/settings-service';
export * from './services/swarm-codegen';
export type { Patch } from './services/patcher';
export type { UMLModelCompat } from './compat';
