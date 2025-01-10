"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const youtube_summary_controllers_1 = require("./controllers/youtubeSummary/youtube-summary-controllers");
const http_errors_1 = __importDefault(require("./utils/http-errors"));
const check_auth_1 = __importDefault(require("./middleware/check-auth"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/authRoutes/auth-routes"));
const MONGO_URL = process.env.MONGO_URL || "";
const LOCAL_HOST = process.env.LOCAL_HOST || 5050;
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.use(check_auth_1.default);
app.use("/api/auth", auth_routes_1.default);
app.post("/api/get-summary", youtube_summary_controllers_1.youtubeUrlResponse);
app.get("/api/get-summary-history", youtube_summary_controllers_1.getUserSummaryHistory);
app.delete("/api/delete-summary-history", youtube_summary_controllers_1.deleteAllSummaryHistory);
//Error showing if none of the routes found!
app.use((req, res, next) => {
    next(new http_errors_1.default("Could not find this route.", 404));
});
//httperror middleware use here to return a valid json error instead any html error page
app.use((error, req, res, next) => {
    const statusCode = error.code || 500;
    const errorMessage = error.message || "An unknown error occurred!";
    const response = Object.assign({ message: errorMessage }, (error.extraData && { extraData: error.extraData }));
    res.status(statusCode).json(response);
});
mongoose_1.default
    .connect(MONGO_URL)
    .then(() => {
    app.listen(Number(LOCAL_HOST), () => {
        console.log(`Server is running on port ${LOCAL_HOST}`);
    });
})
    .catch((err) => console.log(err));
