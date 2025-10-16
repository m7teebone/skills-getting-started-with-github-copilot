document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to escape HTML in participant names/emails
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Replace card innerHTML to include participants section
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5 class="participants-title">Participants</h5>
            ${
              details.participants && details.participants.length > 0
                ? `<ul class="participants-list">
                             ${details.participants
                               .map(
                                 (p) =>
                                   `<li class="participant-item">${escapeHtml(p)} <button class="unregister-btn" data-activity="${escapeHtml(
                                     name
                                   )}" data-email="${escapeHtml(p)}" title="Unregister">&times;</button></li>`
                               )
                               .join("")}
                           </ul>`
                : `<p class="no-participants">No participants yet</p>`
            }
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Attach click handlers for unregister buttons
          const unregisterButtons = activityCard.querySelectorAll('.unregister-btn');
          unregisterButtons.forEach((btn) => {
            btn.addEventListener('click', async (ev) => {
              const activityName = btn.dataset.activity;
              const email = btn.dataset.email;

              if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                    email
                  )}`,
                  { method: 'DELETE' }
                );

                const result = await res.json();
                if (res.ok) {
                  // Refresh activities list
                  fetchActivities();
                  messageDiv.textContent = result.message;
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                messageDiv.textContent = 'Failed to unregister participant. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh the activities list so the newly-registered participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
