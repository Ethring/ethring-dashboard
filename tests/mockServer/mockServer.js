const mockserver = require('mockserver-node');
const path = require('path');
const fs = require('fs');

const pathToMock = path.resolve(__dirname, 'initializer.json');
console.log(`>>> Path to mockfile:\n${pathToMock}\nis exist: ${fs.existsSync(pathToMock)}`);

mockserver.start_mockserver({
    serverPort: 1080,
    trace: false,
    systemProperties: '',
    jvmOptions: [
        '-Dmockserver.enableCORSForAllResponses=true',
        '-Dmockserver.corsAllowMethods="CONNECT, DELETE, GET, HEAD, OPTIONS, POST, PUT, PATCH, TRACE"',
        '-Dmockserver.corsAllowHeaders="Allow, Content-Encoding, Content-Length, Content-Type, ETag, Expires, Last-Modified, Location, Server, Vary, Authorization"',
        '-Dmockserver.corsAllowCredentials=true',
        '-Dmockserver.corsMaxAgeInSeconds=300',
        `-Dmockserver.initializationJsonPath=${pathToMock}`,
        '-Dmockserver.disableLogging=true',
        '-Dmockserver.maxLogEntries=20',
        '-Dmockserver.logLevel="OFF"',
    ],
});
