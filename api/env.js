export default function handler(req, res) {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`window.ENV = { API_KEY: "${process.env.API_KEY}" };`);
}