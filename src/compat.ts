/**
 * Deprecated names from `@10xscale/agentflow-client`, kept so code written against the old
 * package keeps compiling after switching the import to `10xgraph-client`.
 * Each alias is the same class or type as its new name, so `instanceof` checks still work.
 * All of them will be removed in 2.0.
 */
import { TenxGraphClient, TenxGraphConfig } from './client.js';
import { TenxGraphError } from './errors.js';
import {
  TenxGraphAuth,
  TenxGraphBasicAuth,
  TenxGraphBearerAuth,
  TenxGraphHeaderAuth,
} from './request.js';

/** @deprecated Use `TenxGraphClient`. Removed in 2.0. */
export const AgentFlowClient = TenxGraphClient;
/** @deprecated Use `TenxGraphClient`. Removed in 2.0. */
export type AgentFlowClient = TenxGraphClient;

/** @deprecated Use `TenxGraphError`. Removed in 2.0. */
export const AgentFlowError = TenxGraphError;
/** @deprecated Use `TenxGraphError`. Removed in 2.0. */
export type AgentFlowError = TenxGraphError;

/** @deprecated Use `TenxGraphConfig`. Removed in 2.0. */
export type AgentFlowConfig = TenxGraphConfig;
/** @deprecated Use `TenxGraphAuth`. Removed in 2.0. */
export type AgentFlowAuth = TenxGraphAuth;
/** @deprecated Use `TenxGraphBearerAuth`. Removed in 2.0. */
export type AgentFlowBearerAuth = TenxGraphBearerAuth;
/** @deprecated Use `TenxGraphBasicAuth`. Removed in 2.0. */
export type AgentFlowBasicAuth = TenxGraphBasicAuth;
/** @deprecated Use `TenxGraphHeaderAuth`. Removed in 2.0. */
export type AgentFlowHeaderAuth = TenxGraphHeaderAuth;
