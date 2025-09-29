import {web} from "./application/web.js";
import {logger} from "./application/logging.js";

web.listen(3000, () => {
    const port = process.env.PORT || 3000;
    const appUrl = process.env.APP_URL || 'http://localhost';
    console.log(`Server running at ${appUrl}:${port}/api`);
});