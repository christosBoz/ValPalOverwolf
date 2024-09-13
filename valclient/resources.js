const baseEndpointLocal = "http://127.0.0.1:{port}";
const baseEndpoint = "https://pd.{shard}.a.pvp.net";
const baseEndpointGlz = "https://glz-{region}-1.{shard}.a.pvp.net";
const baseEndpointShared = "https://shared.{shard}.a.pvp.net";

const regions = ["na", "eu", "latam", "br", "ap", "kr", "pbe"];
const regionShardOverride = {
    "latam": "na",
    "br": "na"
};
const shardRegionOverride = {
    "pbe": "na"
};

const queues = [
    "competitive",
    "custom",
    "deathmatch",
    "ggteam",
    "snowball",
    "spikerush",
    "unrated",
    "onefa",
    "null"
];
