# LinksForMusic API

API-only service for converting music URLs across streaming platforms.

Core flow:

```txt
paste Spotify/Apple/Deezer/etc URL -> get same song/album URLs on other services
```

Local dev:

```bash
pnpm --filter @linksformusic/api dev
```

## Shared Conventions

### Auth

Production API routes should use API key auth:

```http
Authorization: Bearer lfm_live_xxxxx
```

Public route:

- `GET /health`

### Common Query Parameters

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `market` | string | `US` | ISO country code for regional catalog availability. |
| `limit` | number | `10` | Result limit. Default `10`, max `50`. |
| `offset` | number | `20` | Pagination offset. |
| `type` | string | `track` | `track`, `album`, `artist`, or `all`. |
| `include` | string | `metadata,availability` | Optional response expansions. |

### Common Error Shape

```json
{
  "error": {
    "code": "not_found",
    "message": "Track could not be found.",
    "requestId": "req_123"
  }
}
```

### Matching Accuracy

Track matching should prefer `ISRC`.

Album matching should prefer `UPC` or `EAN`.

Fallback signals:

- normalized title
- normalized artist names
- album title
- duration range
- release date
- track count
- artwork similarity

Confidence guide:

- `0.95-1.00`: return direct match
- `0.80-0.94`: return match plus warning
- `<0.80`: return candidates, no final match

## Health

### `GET /health`

What it does: checks API process health.

Query parameters: none.

Example request:

```http
GET /health
```

Example response:

```json
{
  "ok": true,
  "service": "api"
}
```

## URL Conversion APIs

### `POST /v1/convert`

What it does: accepts one music URL and returns equivalent URLs across supported services.

Use this as main product endpoint.

Query parameters: none.

Example request:

```json
{
  "url": "https://open.spotify.com/track/123",
  "market": "US",
  "services": ["spotify", "appleMusic", "deezer", "youtubeMusic", "tidal", "amazonMusic"],
  "include": ["metadata", "availability"]
}
```

Example response:

```json
{
  "input": {
    "url": "https://open.spotify.com/track/123",
    "service": "spotify",
    "type": "track",
    "providerId": "123"
  },
  "match": {
    "type": "track",
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "After Hours",
    "isrc": "USUG11904206",
    "confidence": 0.99,
    "matchMethod": "isrc"
  },
  "urls": {
    "spotify": "https://open.spotify.com/track/123",
    "appleMusic": "https://music.apple.com/us/song/blinding-lights/...",
    "deezer": "https://www.deezer.com/track/...",
    "youtubeMusic": "https://music.youtube.com/watch?v=...",
    "tidal": "https://tidal.com/browse/track/...",
    "amazonMusic": "https://music.amazon.com/albums/..."
  },
  "availability": {
    "spotify": ["US", "GB", "IN"],
    "appleMusic": ["US", "GB", "IN"],
    "deezer": ["US", "FR", "DE"]
  }
}
```

### `POST /v1/convert/batch`

What it does: converts many track or album URLs in one request.

Query parameters: none.

Example request:

```json
{
  "urls": [
    "https://open.spotify.com/track/123",
    "https://music.apple.com/us/album/after-hours/..."
  ],
  "market": "US",
  "services": ["spotify", "appleMusic", "deezer", "youtubeMusic"]
}
```

Example response:

```json
{
  "results": [
    {
      "inputUrl": "https://open.spotify.com/track/123",
      "status": "matched",
      "type": "track",
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "confidence": 0.99,
      "urls": {
        "spotify": "...",
        "appleMusic": "...",
        "deezer": "...",
        "youtubeMusic": "..."
      }
    },
    {
      "inputUrl": "https://music.apple.com/us/album/after-hours/...",
      "status": "matched",
      "type": "album",
      "title": "After Hours",
      "artist": "The Weeknd",
      "confidence": 0.98,
      "urls": {
        "spotify": "...",
        "appleMusic": "...",
        "deezer": "...",
        "youtubeMusic": "..."
      }
    }
  ]
}
```

### `POST /v1/convert/preview`

What it does: parses URL and shows detected entity before full provider matching.

Useful for debugging client input.

Query parameters: none.

Example request:

```json
{
  "url": "https://open.spotify.com/album/456"
}
```

Example response:

```json
{
  "service": "spotify",
  "type": "album",
  "providerId": "456",
  "canonicalInputUrl": "https://open.spotify.com/album/456"
}
```

## Search APIs

### `GET /v1/search`

What it does: searches tracks, albums, artists, or all music entities.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `q` | string | `blinding lights` | Required search term. |
| `type` | string | `track` | `track`, `album`, `artist`, or `all`. |
| `market` | string | `US` | Region-specific results. |
| `limit` | number | `5` | Max result count. |
| `offset` | number | `0` | Pagination offset. |

Example request:

```http
GET /v1/search?q=blinding%20lights&type=track&market=US&limit=5
```

Example response:

```json
{
  "results": [
    {
      "id": "trk_123",
      "type": "track",
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "album": "After Hours",
      "durationMs": 200040,
      "artwork": "https://cdn.linksformusic.com/artwork/trk_123.jpg",
      "isrc": "USUG11904206",
      "source": "spotify"
    }
  ],
  "pagination": {
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```

### `GET /v1/search/suggest`

What it does: fast autocomplete suggestions for client search UI.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `q` | string | `blind` | Required partial search term. |
| `type` | string | `track` | Optional entity filter. |
| `market` | string | `US` | Region-specific suggestions. |
| `limit` | number | `8` | Default `8`, max `20`. |

Example request:

```http
GET /v1/search/suggest?q=blind&type=track&market=US&limit=5
```

Example response:

```json
{
  "suggestions": [
    {
      "id": "trk_123",
      "label": "Blinding Lights - The Weeknd",
      "type": "track",
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "album": "After Hours",
      "artwork": "https://cdn.linksformusic.com/artwork/trk_123.jpg"
    }
  ]
}
```

### `GET /v1/search/exact`

What it does: high-confidence lookup by title, artist, and optional album.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `title` | string | `Blinding Lights` | Required. |
| `artist` | string | `The Weeknd` | Required. |
| `album` | string | `After Hours` | Optional. |
| `type` | string | `track` | `track` or `album`. |
| `market` | string | `US` | Optional region. |

Example request:

```http
GET /v1/search/exact?title=Blinding%20Lights&artist=The%20Weeknd&album=After%20Hours&type=track&market=US
```

Example response:

```json
{
  "match": {
    "id": "trk_123",
    "type": "track",
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "After Hours",
    "isrc": "USUG11904206",
    "confidence": 0.97
  }
}
```

### `POST /v1/search/batch`

What it does: searches multiple terms in one request.

Query parameters: none.

Example request:

```json
{
  "queries": [
    {
      "q": "blinding lights",
      "type": "track",
      "market": "US"
    },
    {
      "q": "after hours the weeknd",
      "type": "album",
      "market": "US"
    }
  ],
  "limit": 3
}
```

Example response:

```json
{
  "results": [
    {
      "q": "blinding lights",
      "matches": [
        {
          "id": "trk_123",
          "type": "track",
          "title": "Blinding Lights",
          "artist": "The Weeknd"
        }
      ]
    },
    {
      "q": "after hours the weeknd",
      "matches": [
        {
          "id": "alb_123",
          "type": "album",
          "title": "After Hours",
          "artist": "The Weeknd"
        }
      ]
    }
  ]
}
```

## Identifier Lookup APIs

### `GET /v1/lookup/isrc/{isrc}`

What it does: finds track by ISRC and returns URLs across services.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `market` | string | `US` | Optional region filter. |
| `services` | string | `spotify,appleMusic` | Optional comma-separated service filter. |

Example request:

```http
GET /v1/lookup/isrc/USUG11904206?market=US&services=spotify,appleMusic,deezer
```

Example response:

```json
{
  "type": "track",
  "title": "Blinding Lights",
  "artist": "The Weeknd",
  "album": "After Hours",
  "isrc": "USUG11904206",
  "urls": {
    "spotify": "...",
    "appleMusic": "...",
    "deezer": "..."
  }
}
```

### `GET /v1/lookup/upc/{upc}`

What it does: finds album by UPC/EAN and returns URLs across services.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `market` | string | `US` | Optional region filter. |
| `services` | string | `spotify,appleMusic` | Optional comma-separated service filter. |

Example request:

```http
GET /v1/lookup/upc/00602508536561?market=US&services=spotify,appleMusic,deezer
```

Example response:

```json
{
  "type": "album",
  "title": "After Hours",
  "artist": "The Weeknd",
  "upc": "00602508536561",
  "releaseDate": "2020-03-20",
  "urls": {
    "spotify": "...",
    "appleMusic": "...",
    "deezer": "..."
  }
}
```

### `POST /v1/lookup/ids`

What it does: batch lookup by ISRC, UPC, or provider IDs.

Query parameters: none.

Example request:

```json
{
  "items": [
    {
      "type": "track",
      "isrc": "USUG11904206"
    },
    {
      "type": "album",
      "upc": "00602508536561"
    },
    {
      "type": "track",
      "provider": "spotify",
      "providerId": "123"
    }
  ],
  "market": "US",
  "services": ["spotify", "appleMusic", "deezer"]
}
```

Example response:

```json
{
  "results": [
    {
      "status": "matched",
      "type": "track",
      "isrc": "USUG11904206",
      "title": "Blinding Lights",
      "urls": {
        "spotify": "...",
        "appleMusic": "...",
        "deezer": "..."
      }
    },
    {
      "status": "matched",
      "type": "album",
      "upc": "00602508536561",
      "title": "After Hours",
      "urls": {
        "spotify": "...",
        "appleMusic": "...",
        "deezer": "..."
      }
    }
  ]
}
```

## Metadata Match APIs

### `POST /v1/match/track`

What it does: matches track from metadata and returns URLs across services.

Query parameters: none.

Example request:

```json
{
  "title": "N95",
  "artist": "Kendrick Lamar",
  "album": "Mr. Morale & The Big Steppers",
  "durationMs": 195000,
  "isrc": "USUM72208959",
  "market": "US",
  "services": ["spotify", "appleMusic", "youtubeMusic"]
}
```

Example response:

```json
{
  "confidence": 0.98,
  "matchMethod": "isrc",
  "track": {
    "id": "trk_456",
    "title": "N95",
    "artist": "Kendrick Lamar",
    "album": "Mr. Morale & The Big Steppers",
    "isrc": "USUM72208959"
  },
  "urls": {
    "spotify": "...",
    "appleMusic": "...",
    "youtubeMusic": "..."
  }
}
```

### `POST /v1/match/album`

What it does: matches album from metadata and returns URLs across services.

Query parameters: none.

Example request:

```json
{
  "title": "After Hours",
  "artist": "The Weeknd",
  "upc": "00602508536561",
  "releaseDate": "2020-03-20",
  "market": "US",
  "services": ["spotify", "appleMusic", "tidal"]
}
```

Example response:

```json
{
  "confidence": 0.99,
  "matchMethod": "upc",
  "album": {
    "id": "alb_123",
    "title": "After Hours",
    "artist": "The Weeknd",
    "upc": "00602508536561"
  },
  "urls": {
    "spotify": "...",
    "appleMusic": "...",
    "tidal": "..."
  }
}
```

### `POST /v1/match/candidates`

What it does: returns ranked possible matches without choosing final match.

Query parameters: none.

Example request:

```json
{
  "type": "track",
  "title": "One Dance",
  "artist": "Drake",
  "market": "US",
  "limit": 5
}
```

Example response:

```json
{
  "candidates": [
    {
      "id": "trk_789",
      "confidence": 0.91,
      "title": "One Dance",
      "artist": "Drake",
      "album": "Views",
      "isrc": "USCM51600028"
    },
    {
      "id": "trk_790",
      "confidence": 0.72,
      "title": "One Dance",
      "artist": "Drake",
      "album": "One Dance"
    }
  ]
}
```

## Metadata APIs

### `GET /v1/tracks/{id}`

What it does: returns normalized track metadata.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `include` | string | `urls,availability` | Optional expansions. |
| `market` | string | `US` | Optional region filter. |

Example request:

```http
GET /v1/tracks/trk_123?include=urls,availability&market=US
```

Example response:

```json
{
  "id": "trk_123",
  "title": "Blinding Lights",
  "artists": ["The Weeknd"],
  "album": "After Hours",
  "durationMs": 200040,
  "isrc": "USUG11904206",
  "explicit": false,
  "releaseDate": "2019-11-29",
  "artwork": "https://cdn.linksformusic.com/artwork/trk_123.jpg",
  "urls": {
    "spotify": "...",
    "appleMusic": "..."
  }
}
```

### `GET /v1/albums/{id}`

What it does: returns normalized album metadata.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `include` | string | `tracks,urls` | Optional expansions. |
| `market` | string | `US` | Optional region filter. |

Example request:

```http
GET /v1/albums/alb_123?include=tracks,urls&market=US
```

Example response:

```json
{
  "id": "alb_123",
  "title": "After Hours",
  "artists": ["The Weeknd"],
  "upc": "00602508536561",
  "releaseDate": "2020-03-20",
  "totalTracks": 14,
  "artwork": "https://cdn.linksformusic.com/artwork/alb_123.jpg",
  "urls": {
    "spotify": "...",
    "appleMusic": "..."
  }
}
```

### `GET /v1/albums/{id}/tracks`

What it does: returns album tracklist.

Query parameters: none.

Example request:

```http
GET /v1/albums/alb_123/tracks
```

Example response:

```json
{
  "albumId": "alb_123",
  "tracks": [
    {
      "position": 1,
      "title": "Alone Again",
      "durationMs": 250000,
      "isrc": "USUG12000653"
    },
    {
      "position": 9,
      "title": "Blinding Lights",
      "durationMs": 200040,
      "isrc": "USUG11904206"
    }
  ]
}
```

### `GET /v1/artists/{id}`

What it does: returns normalized artist metadata.

Query parameters:

| Parameter | Type | Example | Notes |
| --- | --- | --- | --- |
| `include` | string | `urls` | Optional expansions. |

Example request:

```http
GET /v1/artists/art_123?include=urls
```

Example response:

```json
{
  "id": "art_123",
  "name": "The Weeknd",
  "image": "https://cdn.linksformusic.com/artists/art_123.jpg",
  "urls": {
    "spotify": "...",
    "appleMusic": "...",
    "youtubeMusic": "..."
  }
}
```

### `GET /v1/tracks/{id}/availability`

What it does: returns regions where track is available per service.

Query parameters: none.

Example request:

```http
GET /v1/tracks/trk_123/availability
```

Example response:

```json
{
  "trackId": "trk_123",
  "availability": {
    "spotify": ["US", "GB", "IN"],
    "appleMusic": ["US", "GB", "IN"],
    "deezer": ["US", "FR", "DE"]
  }
}
```

## Provider APIs

### `GET /v1/services`

What it does: lists supported music services.

Query parameters: none.

Example request:

```http
GET /v1/services
```

Example response:

```json
{
  "services": [
    {
      "id": "spotify",
      "name": "Spotify",
      "supportsTracks": true,
      "supportsAlbums": true,
      "urlPatterns": ["open.spotify.com/track", "open.spotify.com/album"]
    },
    {
      "id": "appleMusic",
      "name": "Apple Music",
      "supportsTracks": true,
      "supportsAlbums": true,
      "urlPatterns": ["music.apple.com"]
    }
  ]
}
```

### `GET /v1/services/{service}/status`

What it does: checks provider-specific API health.

Query parameters: none.

Example request:

```http
GET /v1/services/spotify/status
```

Example response:

```json
{
  "service": "spotify",
  "status": "ok",
  "latencyMs": 180,
  "checkedAt": "2026-07-01T00:00:00Z"
}
```

### `GET /v1/markets`

What it does: lists supported countries/regions.

Query parameters: none.

Example request:

```http
GET /v1/markets
```

Example response:

```json
{
  "markets": [
    {
      "code": "US",
      "name": "United States"
    },
    {
      "code": "IN",
      "name": "India"
    }
  ]
}
```

## Developer Account APIs

### `GET /v1/api-keys`

What it does: lists API keys. Secret values are not returned.

Query parameters: none.

Example request:

```http
GET /v1/api-keys
```

Example response:

```json
{
  "keys": [
    {
      "id": "key_123",
      "name": "Production Server",
      "prefix": "lfm_live_abc",
      "scopes": ["convert:write", "search:read"],
      "createdAt": "2026-07-01T00:00:00Z"
    }
  ]
}
```

### `POST /v1/api-keys`

What it does: creates developer API key.

Query parameters: none.

Example request:

```json
{
  "name": "Production Server",
  "scopes": ["convert:write", "search:read", "lookup:read"]
}
```

Example response:

```json
{
  "id": "key_123",
  "name": "Production Server",
  "key": "lfm_live_xxxxx",
  "scopes": ["convert:write", "search:read", "lookup:read"]
}
```

### `DELETE /v1/api-keys/{id}`

What it does: revokes API key.

Query parameters: none.

Example request:

```http
DELETE /v1/api-keys/key_123
```

Example response:

```json
{
  "id": "key_123",
  "revoked": true
}
```

### `GET /v1/rate-limit`

What it does: shows API quota state for current key.

Query parameters: none.

Example request:

```http
GET /v1/rate-limit
```

Example response:

```json
{
  "limit": 100000,
  "remaining": 51680,
  "resetAt": "2026-08-01T00:00:00Z"
}
```

### `GET /v1/usage`

What it does: returns API usage counters.

Query parameters: none.

Example request:

```http
GET /v1/usage
```

Example response:

```json
{
  "period": "2026-07",
  "apiRequests": 48320,
  "conversions": 2100,
  "searchRequests": 9400,
  "limit": {
    "apiRequests": 100000
  }
}
```

## Batch Job APIs

### `POST /v1/jobs/convert-csv`

What it does: converts a CSV of music URLs asynchronously.

Query parameters: none.

Example request:

```json
{
  "fileUrl": "https://example.com/catalog.csv",
  "columns": {
    "url": "music_url"
  },
  "market": "US",
  "services": ["spotify", "appleMusic", "deezer", "youtubeMusic"]
}
```

Example response:

```json
{
  "jobId": "job_123",
  "status": "queued",
  "estimatedRows": 5000
}
```

### `POST /v1/jobs/match-catalog`

What it does: matches label/distributor catalog rows by ISRC, UPC, or metadata.

Query parameters: none.

Example request:

```json
{
  "fileUrl": "https://example.com/catalog.csv",
  "columns": {
    "type": "entity_type",
    "title": "title",
    "artist": "artist_name",
    "isrc": "isrc",
    "upc": "upc"
  },
  "market": "US",
  "services": ["spotify", "appleMusic", "deezer"]
}
```

Example response:

```json
{
  "jobId": "job_456",
  "status": "queued",
  "estimatedRows": 25000
}
```

### `GET /v1/jobs/{id}`

What it does: returns async job status.

Query parameters: none.

Example request:

```http
GET /v1/jobs/job_123
```

Example response:

```json
{
  "jobId": "job_123",
  "status": "processing",
  "processedRows": 3200,
  "totalRows": 5000,
  "errors": 12
}
```

### `GET /v1/jobs/{id}/results`

What it does: returns job result download URL.

Query parameters: none.

Example request:

```http
GET /v1/jobs/job_123/results
```

Example response:

```json
{
  "jobId": "job_123",
  "status": "completed",
  "downloadUrl": "https://api.linksformusic.com/downloads/job_123.csv"
}
```

## Webhook APIs

### `POST /v1/webhooks`

What it does: creates webhook subscription for async API events.

Query parameters: none.

Supported webhook events:

- `conversion.completed`
- `conversion.failed`
- `batch.completed`
- `batch.failed`
- `provider.down`

Example request:

```json
{
  "url": "https://example.com/webhooks/linksformusic",
  "events": ["conversion.completed", "conversion.failed", "batch.completed"]
}
```

Example response:

```json
{
  "id": "wh_123",
  "url": "https://example.com/webhooks/linksformusic",
  "events": ["conversion.completed", "conversion.failed", "batch.completed"],
  "secret": "whsec_xxxxx"
}
```

### `GET /v1/webhooks`

What it does: lists webhook subscriptions.

Query parameters: none.

Example request:

```http
GET /v1/webhooks
```

Example response:

```json
{
  "webhooks": [
    {
      "id": "wh_123",
      "url": "https://example.com/webhooks/linksformusic",
      "events": ["conversion.completed", "conversion.failed"],
      "enabled": true
    }
  ]
}
```

## Internal Provider Debug APIs

Admin-only. Not customer-facing.

### `GET /v1/internal/providers/health`

What it does: returns all provider API health states.

Query parameters: none.

Example request:

```http
GET /v1/internal/providers/health
```

Example response:

```json
{
  "spotify": {
    "status": "ok",
    "latencyMs": 180
  },
  "appleMusic": {
    "status": "degraded",
    "latencyMs": 920
  },
  "deezer": {
    "status": "ok",
    "latencyMs": 240
  }
}
```

### `GET /v1/internal/providers/{provider}/{type}/{id}`

What it does: returns raw provider response for debugging.

Query parameters: none.

Example request:

```http
GET /v1/internal/providers/spotify/track/123
```

Example response:

```json
{
  "provider": "spotify",
  "type": "track",
  "providerId": "123",
  "raw": {
    "id": "123",
    "name": "Blinding Lights"
  }
}
```

## MVP Build Order

1. `POST /v1/convert`
2. `POST /v1/convert/batch`
3. `GET /v1/search/suggest`
4. `GET /v1/search`
5. `GET /v1/lookup/isrc/{isrc}`
6. `GET /v1/lookup/upc/{upc}`
7. `POST /v1/match/track`
8. `POST /v1/match/album`
9. `GET /v1/services`
10. `GET /v1/rate-limit`

## Data Model Sketch

Core entities:

- `tracks`
- `albums`
- `artists`
- `provider_urls`
- `provider_entities`
- `conversion_requests`
- `api_keys`
- `usage_events`
- `webhooks`
- `jobs`

Provider URL uniqueness:

- `provider`
- `entity_type`
- `provider_entity_id`
- `market`

Track uniqueness:

- primary: `isrc`
- fallback: normalized title, normalized artists, duration range, release date

Album uniqueness:

- primary: `upc` or `ean`
- fallback: normalized title, normalized primary artist, release date, track count
