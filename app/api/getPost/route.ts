import { createSdk, session } from "@descope/nextjs-sdk/server";
import axios from "axios";

const descopeClient = createSdk({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
  managementKey: process.env.DESCOPE_MANAGEMENT_KEY,
});

export async function POST(request: Request) {
  const requestBody = await request.json();
  const user = requestBody.user;
  const postText = requestBody.postText;

  //    loginId (str): The login_id of the user to be loaded.
  const loginId = user.id;
  //    provider (str): The provider name (google, facebook, etc')
  const provider = "linkedin";
  const resp = await descopeClient.management.user.getProviderToken(
    loginId,
    provider
  );
  if (!resp.ok) {
    return new Response("not able to get provider token", { status: 401 });
  }
  const providerToken = resp.data;

  // LinkedIn API endpoint for creating posts
  const linkedInPostUrl = "https://api.linkedin.com/v2/ugcPosts";

  // Define the content of the post
  const postData = {
    author: `urn:li:person:${providerToken?.providerUserId}`, // Replace with the LinkedIn user ID
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: postText,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  try {
    // Make a POST request to the LinkedIn API
    const response = await axios.post(linkedInPostUrl, postData, {
      headers: {
        Authorization: `Bearer ${providerToken?.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    return new Response(JSON.stringify({ data: "Posting Succeeded" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ data: "Posting Failed" }), {
       status: 401, // Use the response status or default to 401
    });
  }
}
