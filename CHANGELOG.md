# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1]

### Added
- Added a safer anti-reentrancy guard for action flows by tracking active executions with a reference counter instead of a simple boolean flag.
- Added defensive filtering for internal Pinia actions whose names start with `$` or `_` so they are not processed as user action flows.
- Added richer regression tests covering real Pinia dispatch, method-name flow resolution, reentrancy protection, and circular-argument safety.

### Changed
- Reworked flow tracking to avoid `JSON.stringify`-based keys, removing a source of circular-reference crashes and unnecessary serialization overhead.
- Switched the test setup to match actual Pinia plugin lifecycle requirements by installing the Pinia instance through an application context before exercising store actions.
- Improved `before`/`after` flow execution logic so the guard is released only after all related flow callbacks have completed.

### Fixed
- Fixed a bug where a pending flow guard could be cleared too early when both before and after hooks shared the same action key.
- Prevented accidental invocation of internal or framework-managed store methods from flow configuration.
- Improved test realism by exercising the plugin through normal Pinia action dispatch rather than manually simulating hook callbacks.

