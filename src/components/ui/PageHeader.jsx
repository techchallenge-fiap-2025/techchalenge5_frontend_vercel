export function PageHeader({ title, buttonText, onButtonClick, buttons }) {
  // Se buttons for fornecido, usar array de botões, senão usar buttonText (compatibilidade com código existente)
  const buttonsToRender = buttons || (buttonText ? [{ text: buttonText, onClick: onButtonClick }] : []);

  return (
    <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
      <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-dark">{title}</h2>
          {buttonsToRender.length > 0 && (
            <div className="flex items-center justify-end gap-3">
              {buttonsToRender.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`${
                    button.variant === "secondary"
                      ? "bg-gray-500 text-white hover:bg-gray-600"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  } cursor-pointer transition-colors rounded-lg py-2 px-4 sm:px-6 text-sm font-medium whitespace-nowrap`}
                >
                  {button.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
