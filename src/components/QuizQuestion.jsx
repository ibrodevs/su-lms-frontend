export default function QuizQuestion({ question, selected, onSelect }) {
  return (
    <div className="quiz-question">
      <h2>{question.question}</h2>
      <div className="answer-list">
        {question.options.map((option, index) => (
          <button
            className={selected === index ? "answer-option selected" : "answer-option"}
            key={option}
            type="button"
            onClick={() => onSelect(index)}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
