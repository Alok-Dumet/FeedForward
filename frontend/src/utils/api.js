export async function apiRequest(url, { method = 'GET', body = null, errorMessage = 'Request failed.', networkErrorMessage = 'Network Error' } = {}) {
  const requestOptions = {
    method,
    headers: {
      Accept: 'application/json',
    },
  };

  if (body) {
    requestOptions.headers['Content-Type'] = 'application/json';
    requestOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, requestOptions);
  } catch {
    throw new Error(networkErrorMessage);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = errorMessage;
    if (data && data.error) {
      message = data.error;
    }

    throw new Error(message);
  }

  return data;
}
