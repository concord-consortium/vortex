import { setLogLevel, LogLevel } from "./shared/utils/log";

const enzyme = require("enzyme");
const Adapter = require("enzyme-adapter-react-16");

enzyme.configure({ adapter: new Adapter() });

// prevent tests from being cluttered with log messages
setLogLevel(LogLevel.None);
