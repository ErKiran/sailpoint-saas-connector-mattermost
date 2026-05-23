# Mattermost SaaS Connector - TypeScript/Jest Configuration Notes

This project is based on the default SailPoint Connector SDK generated project.  
After generating the base connector, a few changes were required to make the local TypeScript build and Jest test setup work correctly.

## Why These Changes Were Needed

The base SailPoint generated connector project gives a good starting point, but the default TypeScript and Jest configuration may not fully align with the current local Node.js, TypeScript, Jest, and `ts-jest` versions.

During setup, the project had the following issues:

- `ts-jest` preset resolution errors
- Missing Node.js type definitions
- Missing Jest globals such as `describe`, `it`, and `expect`
- TypeScript module resolution warnings
- SailPoint SDK `Context` type mismatch in unit tests
- Compatibility issues between `typescript`, `jest`, and `ts-jest`

The following updates were made to stabilize the development and test environment.

---

## 1. Installed Required Development Dependencies

The project requires TypeScript, Jest, ts-jest, and the proper type definitions.

```bash
npm install --save-dev typescript jest@29 ts-jest@29 @types/jest @types/node
```

![Test Result](docs/test.png)