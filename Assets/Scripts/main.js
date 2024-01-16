const questionList = [
  {
    question: "This is a randomized question?",
    answers: ["Correct Answer", "Wrong Answer", "Wrong Answer", "Wrong Answer"],
    correctAnswer: 0,
  },
];

// List of all screen names
// Used to show / hide different states of the page (start/default, quiz started, quiz ended)
const screens = ["start-screen", "quiz-screen", "end-screen"];

// Track score and total questions answered so we can average later
let score = 0;
let questionsAnswered = 0;

// Create a default timer of 60 seconds
const startTime = 60;
let timeLeft = startTime;

// Create a variable to hold our timer interval so that we can clear it later
let timerInterval;

// Self executing function to start the game (Preventing unwanted global variables)
// Setup initial page / quiz state and create event listeners
(() => {
  // Display the start time - Allows us to use a variable to share the same time everywhere
  const timeLeftElement = document.querySelector("#time-left");
  timeLeftElement.textContent = timeLeft;

  // Handle showing the highscores popup
  const highscoreButtonElement = document.querySelector("#highscores-btn");
  highscoreButtonElement.addEventListener("click", (e) => {
    showHighscores();
  });

  // Handle the default screen / start quiz screen
  const startButtonElement = document.querySelector("#start-btn");
  startButtonElement.addEventListener("click", (e) => {
    startQuiz();
  });

  // Handle submitting the score to local storage / redirecting back to quiz start
  const submitButtonElement = document.querySelector("#submission-form");
  submitButtonElement.addEventListener("submit", (e) => {
    // Prevent default so that we handle the redirect instead of the form submission
    e.preventDefault();

    // Handle local storage saving and changing screen back to start
    saveScore();
  });

  // Handle hiding / closing the highscores popup
  const exitHighscoresButtonElement = document.querySelector(
    "#exit-highscores-btn"
  );
  exitHighscoresButtonElement.addEventListener("click", (e) => {
    const overlayElement = document.querySelector("#highscores-container");
    overlayElement.classList.add("display-none");
  });

  // Handle clearing the highscores from local storage
  const clearHighscoresButtonElement = document.querySelector(
    "#highscores-clear-btn"
  );
  clearHighscoresButtonElement.addEventListener("click", (e) => {
    clearHighscores();
  });
})();

// Helper function for changing to any screen
function changeScreen(screenName) {
  // Iterate all of our screen names
  // We hide all screen elements that do not match our screenName and show the matching screen
  for (let i = 0; i < screens.length; i++) {
    // Dynamically get the screen element by its name
    const screenElement = document.querySelector(`#${screens[i]}`);
    if (screens[i] === screenName) {
      screenElement.classList.remove("display-none");
    } else {
      screenElement.classList.add("display-none");
    }
  }
}

// Starts our quiz - order of these functions is important for the users experience
function startQuiz() {
  // Set default quiz state
  // Generate a question to prep for start of the quiz
  generateQuestion();

  // Reset the timer state
  resetTimer();

  // Change screen to quiz which displays the generated question
  changeScreen("quiz-screen");

  // Start our timer
  startTimer();
}

function generateQuestion() {
  // Get the container of the answers to clear and also append the answer elements to
  const answerContainerElement = document.querySelector("#answer-container");

  // Clear previous answers if they exist
  clearElementChildren(answerContainerElement);

  // Generate a random question from the question list
  const question =
    questionList[Math.floor(Math.random() * questionList.length)];

  // Update question element to reflect question text
  const questionElement = document.querySelector("#question");
  questionElement.textContent = question.question;

  // Create a deep clone of the question object so that we can modify it and the underlying array without modifying the original
  const deepCopy = structuredClone(question);
  // Randomize the answers so that repeated questions do not reflect the same order of answers
  const randomizedQuestion = randomizeAnswers(deepCopy);

  // Iterate the answers and create / append the answers to the container
  for (let i = 0; i < randomizedQuestion.answers.length; i++) {
    const answerElement = createAnswerElement(randomizedQuestion.answers[i], i);

    // Pass randomizedQuestion to our answer event listener so that it can be compared to our data-id that is attached to each button
    // This gets destroyed when the button is removed from the DOM
    answerElement.addEventListener("click", (e) =>
      answerClicked(e, randomizedQuestion)
    );

    answerContainerElement.appendChild(answerElement);
  }
}

// Create answer elements
function createAnswerElement(answer, index) {
  const answerButton = document.createElement("button");
  answerButton.classList.add("answer-btn");

  // Set data-id to index so that we can compare to the answer index later
  answerButton.setAttribute("data-id", index);
  answerButton.textContent = answer;
  return answerButton;
}

let answerStatusTimeout;
function answerClicked(e, question) {
  // Reset our timeout so that if a user is answering quickly the previous timer does not trigger
  clearTimeout(answerStatusTimeout);

  // Get our answer id (index of the answer)
  const answerId = parseInt(e.target.getAttribute("data-id"));

  // Set the data-status attribute to the answer status text
  // Compares the id (index) attached to the element to the correct answer from our question object
  const answerStatusElement = document.querySelector("#answer-status");

  // Check if the answer is correct - data-status reflects the popup flavor status shown
  if (answerId === question.correctAnswer) {
    score++;
    answerStatusElement.setAttribute("data-status", "Correct!");
  } else {
    // Penalty of 10 seconds per wrong answer
    const timePenalty = 10;
    deductTimeleft(timePenalty);
    answerStatusElement.setAttribute("data-status", "Wrong!");
  }

  // Track total questions answered so we can average the score later
  questionsAnswered++;
  generateQuestion();

  // Display our updated answer status
  answerStatusElement.classList.remove("hidden");

  // Create a timeout to hide the answer status after 1 second
  // Save this so that we can clear it to prevent duplicate timeouts
  answerStatusTimeout = setTimeout(() => {
    answerStatusElement.classList.add("hidden");
  }, 1000);
}

function startTimer() {
  // Reset quiz state
  score = 0;
  questionsAnswered = 0;

  // 1 Second Timer
  timerInterval = setInterval(() => {
    // Update the time left by 1 second
    deductTimeleft(1);
  }, 1000);
}

// Helper for clearing the timer interval
function stopTimer() {
  clearInterval(timerInterval);
}

// Reset timer state - Clears interval
function resetTimer() {
  stopTimer();
  timeLeft = startTime;
}

// Handles deducting time from the timer - Handles end of timer as well and changing to end screen
function deductTimeleft(deductionAmount) {
  if (timeLeft - deductionAmount <= 0) {
    // End timer (clears interval) and set to 0 (avoids negative numbers)
    stopTimer();
    timeLeft = 0;

    // Set score to finalzed average score then change screens
    const scoreElement = document.querySelector("#score");

    // Check for 0 to avoid dividing by 0 when no questions are answered
    if (questionsAnswered === 0) {
      scoreElement.textContent = 0;
    } else {
      // Calculate a percentage score and round to 2 decimal places
      scoreElement.textContent = ((score / questionsAnswered) * 100).toFixed(2);
    }

    // Go to end screen / submit score
    changeScreen("end-screen");
  } else {
    // Quiz is still active - Deduct time
    timeLeft -= deductionAmount;
  }

  // Update the time left element (Display)
  const timeLeftElement = document.querySelector("#time-left");
  timeLeftElement.textContent = timeLeft;
}

// Save score to local storage
function saveScore() {
  // Get initials from input and validate that they are not empty
  const initialsElement = document.querySelector("#initials");

  if (initialsElement.value === "") {
    alert("Please enter your initials!");
    return;
  }

  // Get highscores from local storage or create an empty array to append to
  let highscores = [];

  // Check if highscores exist in local storage
  // If they do, parse them and set to our highscores variable
  if (localStorage.getItem("highscores")) {
    highscores = JSON.parse(localStorage.getItem("highscores"));
  }

  // Create our new highscore object
  // Set our initials to all uppercase for formatting / consistency
  // Calculate our average and round to 2 decimals for our score display
  const highscoreObject = {
    initials: initialsElement.value.toUpperCase(),
    score: ((score / questionsAnswered) * 100).toFixed(2),
  };
  // Create a new array that spreads our previous highscores and appends our new highscore
  const appendedHighscores = [...highscores, highscoreObject];

  // Set the updated / appended highscore array to local storage as JSON
  localStorage.setItem("highscores", JSON.stringify(appendedHighscores));

  // Popup highscore screen and in the background swap back to start-screen
  showHighscores();
  changeScreen("start-screen");
}

// Displays the highscore popup and gets the highscores from local storage for the display
function showHighscores() {
  const highscores = JSON.parse(localStorage.getItem("highscores"));

  // Show popup
  const overlayElement = document.querySelector("#highscores-container");
  overlayElement.classList.remove("display-none");

  const highscoresElement = document.querySelector("#highscores-list");

  // Clear our previous highscore elements from the list to prep for updated list
  clearElementChildren(highscoresElement);
  if (highscores && highscores.length > 0) {
    // Iterate our highscore array and append to our UL element as an LI
    for (let i = 0; i < highscores.length; i++) {
      const highscoreElement = document.createElement("li");

      // Format our highscores output
      highscoreElement.textContent = `${highscores[i].initials} - ${highscores[i].score}`;
      highscoresElement.appendChild(highscoreElement);
    }
  }
}

// Clear highscores from local storage
function clearHighscores() {
  // Remove form local storage
  localStorage.removeItem("highscores");

  // Update elements to reflect empty highscores
  const highscoresElement = document.querySelector("#highscores-list");
  clearElementChildren(highscoresElement);
}

// Helper function to remove all children from an element
// Useful to clear out previous items from a list before generating new ones
function clearElementChildren(element) {
  // While the element has a first child, remove it
  while (element.firstChild) {
    // Deleting from end of an array is generally faster than deleting from the start
    element.removeChild(element.lastChild);
  }
}

// Durstenfeld Shuffle - (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm)
function randomizeAnswers(question) {
  // Create a shallow copy of the array to avoid mutating the original question order
  const arr = question.answers;

  // Iterate the array from top to bottom (reversed)
  for (let i = arr.length - 1; i > 0; i--) {
    // Generate a random index from passed array
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Handle swapping of where the correct answer's index actually is in the answers array
    if (question.correctAnswer === randomIndex) {
      question.correctAnswer = i;
    }

    // Swap the current index of the loop with the randomized index
    [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
  }

  // Since we are using a deep clone we return the object to make it more clear in the original function what is happening
  return question;
}
