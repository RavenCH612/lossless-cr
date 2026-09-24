/**
 * BitChord Qobuz Lossless source
 * Minimal BitChord/8SPINE-compatible module.
 */
const BASE_URL = "https://qobuz.squid.wtf/api";

async function fetchJson(path) {
  const response = await fetch(BASE_URL + path, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "BitChord-Qobuz/1.0"
    }
  });
  if (!response.ok) throw new Error("Qobuz backend HTTP " + response.status);
  return await response.json();
}

function albumTitle(album) {
  if (!album) return "";
  return album.title || "";
}

async function searchTracks(query, limit, context) {
  const data = await fetchJson("/get-music?q=" + encodeURIComponent(query) + "&offset=0");
  if (!data || !data.success || !data.data) return { tracks: [], total: 0 };

  const bucket = data.data.tracks || {};
  const items = (bucket.items || []).slice(0, limit || 50);
  const tracks = items.map(function(track) {
    const album = track.album || {};
    const performer = track.performer || {};
    const bitDepth = track.maximum_bit_depth || album.maximum_bit_depth || 0;
    const sampleRate = track.maximum_sampling_rate || album.maximum_sampling_rate || 0;
    let quality = "FLAC Lossless";
    if (bitDepth > 16 || sampleRate > 44.1) quality = "Hi-Res FLAC " + bitDepth + "-bit / " + sampleRate + " kHz";

    return {
      id: String(track.id),
      title: track.title || "",
      artist: performer.name || "",
      album: albumTitle(album),
      albumCover: album.image ? (album.image.large || album.image.small || "") : "",
      duration: track.duration || 0,
      audioQuality: quality,
      format: "flac",
      availableQualities: ["LOSSLESS"]
    };
  });

  return { tracks: tracks, total: bucket.total || tracks.length };
}

async function getTrackStreamUrl(trackId, preferredQuality, context) {
  const data = await fetchJson("/download-music?track_id=" + encodeURIComponent(trackId) + "&quality=27");
  if (!data || !data.success || !data.data || !data.data.url) {
    throw new Error("No lossless stream URL returned");
  }

  return {
    streamUrl: data.data.url,
    track: {
      id: String(trackId),
      audioQuality: "FLAC Lossless",
      mimeType: "audio/flac"
    }
  };
}

module.exports = {
  id: "bitchord-qobuz",
  name: "BitChord Qobuz Lossless",
  author: "RavenCH612",
  version: "1.0.0",
  labels: ["FLAC", "LOSSLESS", "QOBUZ"],
  searchTracks: searchTracks,
  getTrackStreamUrl: getTrackStreamUrl
};
