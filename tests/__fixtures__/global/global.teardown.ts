import { test as teardown } from '@playwright/test';
import { deleteAllExtensionsIfTestLocalRun } from '../deleteExtensionUtils';

teardown(`Delete extension's files`, () => {
    deleteAllExtensionsIfTestLocalRun();
});
