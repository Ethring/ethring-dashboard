import { test as teardown } from '@playwright/test';
import { deleteAllExtensionsIfTestLocalRun } from '../fixtureHelper';

teardown(`Delete extension's files`, () => {
    deleteAllExtensionsIfTestLocalRun();
});
