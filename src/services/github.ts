const repoURL = "https://api.github.com/repos/christian-crisologo-lrn/flip-camera/commits";

export const fetchLatestCommitHash = async () => {
  try {
    const response = await fetch(repoURL);
    const data = await response.json();
    return JSON.stringify((data[0].sha));
  } catch (error) {
    console.error('Error fetching commit hash:', error);
  }

  return '';
};