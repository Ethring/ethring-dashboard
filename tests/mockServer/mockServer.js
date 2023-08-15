var mockserver = require('mockserver-node');

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
        '-Dmockserver.initializationJsonPath="/Users/egorreutov/work/zomet-dashboard/tests/mockServer/initializer.json"',
        '-Dmockserver.disableLogging=true',
        '-Dmockserver.maxLogEntries=20',
        '-Dmockserver.logLevel="OFF"',
    ],
});
