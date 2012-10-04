module.exports = {
  doc: {
    groups: {
      "likes": {
        name: "Likes",
        title: "Like Endpoints",
        endpoints: {
          "get-users-who-liked-media": {
            method: "get",
            path: "/media/{media-id}/likes",
            name: "Get a list of users who have liked this media.",
            description: "Get a list of users who have liked this media.\n<small>[Required Scope](#): likes</small>",
            params: [],
            curl: "curl https://api.instagram.com/v1/media/555/likes?access_token=ACCESS-TOKEN",
            response: "..."
          },
          "set-media-like": {
            method: "post",
            path: "/media/{media-id}/likes",
            name: "Set a like on this media by the current user.",
            description: "Set a like on this media by the currently authenticated user.\n<small>[Required Scope](#): likes</small>",
            params: [
              {
                key: "ACCESS_TOKEN",
                description: "A valid access token."
              }
            ],
            curl: "curl -F 'access_token=ACCESS-TOKEN' https://api.instagram.com/v1/media/{media-id}/likes",
            response: "..."
          },
          "remove-media-like": {
            method: "delete",
            path: "/media/{media-id}/likes",
            name: "Remove a like on this media by the current user.",
            description: "Remove a like on this media by the currently authenticated user.\n<small>[Required Scope](#): likes</small>",
            params: [
              {
                key: "ACCESS_TOKEN",
                description: "A valid access token."
              }
            ],
            curl: "curl -X DELETE https://api.instagram.com/v1/media/{media-id}/likes?access_token=ACCESS-TOKEN",
            response: "..."
          }
        }
      },
      "users": {
        name: "Users",
        title: "User Endpoints",
        endpoints: {
          "get-user-information": {
            method: "get",
            path: "/users/{user-id}",
            name: "Get basic information about a user.",
            description: "Get basic information about a user.",
            params: [],
            curl: "https://api.instagram.com/v1/users/1574083/?access_token=ACCESS-TOKEN",
            response: "..."
          },
          "get-self-feed": {
            method: "get",
            path: "/users/self/feed",
            name: "See the authenticated user's feed.",
            description: "See the authenticated user's feed.",
            params: [
              {
                key: "ACCESS_TOKEN",
                description: "A valid access token."
              },
              {
                key: "COUNT",
                description: "Count of media to return."
              },
              {
                key: "MIN_ID",
                description: "Return media later than this min_id."
              },
              {
                key: "MAX_ID",
                description: "Return media earlier than this max_id.s"
              }
            ],
            curl: "https://api.instagram.com/v1/users/self/feed?access_token=ACCESS-TOKEN",
            response: "..."
          },
          "get-user-media": {
            method: "get",
            path: "/users/{user-id}/media/recent",
            name: "See the authenticated user's feed.",
            description: "See the authenticated user's feed.",
            params: [
              {
                key: "COUNT",
                description: "Count of media to return."
              },
              {
                key: "MAX_TIMESTAMP",
                description: "Return media before this UNIX timestamp."
              },
              {
                key: "ACCESS_TOKEN",
                description: "A valid access token."
              },
              {
                key: "MIN_TIMESTAMP",
                description: "Return media after this UNIX timestamp."
              },
              {
                key: "MIN_ID",
                description: "Return media later than this min_id."
              },
              {
                key: "MAX_ID",
                description: "Return media earlier than this max_id.s"
              }
            ],
            curl: "https://api.instagram.com/v1/users/3/media/recent/?access_token=ACCESS-TOKEN",
            response: "..."
          },
          "get-self-media": {
            method: "get",
            path: "/users/self/media/liked",
            name: "See the authenticated user's list of liked media.",
            description: "See the authenticated user's list of media they've liked. Note that this list is ordered by the order in which the user liked the media. Private media is returned as long as the authenticated user has permission to view that media. Liked media lists are only available for the currently authenticated user.",
            params: [
              {
                key: "ACCESS_TOKEN",
                description: "A valid access token."
              },
              {
                key: "COUNT",
                description: "Count of media to return."
              },
              {
                key: "MAX_LIKE_ID",
                description: "Return media liked before this id."
              }
            ],
            curl: "https://api.instagram.com/v1/users/self/media/liked?access_token=ACCESS-TOKEN",
            response: "..."
          },
          "search-user": {
            method: "get",
            path: "/users/search",
            name: "Search for a user by name.",
            description: "Search for a user by name.",
            params: [
              {
                key: "Q",
                description: "A query string."
              },
              {
                key: "COUNT",
                description: "Number of users to return."
              }
            ],
            curl: "https://api.instagram.com/v1/users/search?q=jack&access_token=ACCESS-TOKEN",
            response: "..."
          }
        }
      }
    }
  }
}