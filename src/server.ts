import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Receipt scanner backend listening on port ${config.port}`);
});
