const { getJestConfig } = require('@storybook/test-runner');

const testRunnerConfig = getJestConfig();

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
    // The default Jest configuration comes from @storybook/test-runner
    ...testRunnerConfig,
    testTimeout: 50000, // default timeout is 50s
};
