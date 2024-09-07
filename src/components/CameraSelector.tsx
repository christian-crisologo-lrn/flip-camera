interface CameraSelectorProps {
    selected: string;
    options: string[];
    onOptionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CameraSelector: React.FC<CameraSelectorProps> = ({ selected, onOptionChange, options }) => {

    return (
        <div className="w-full">
            <label htmlFor="dropdown" className="block text-sm font-medium text-gray-700 mb-1">Select an option:</label>
            <select
                id="dropdown"
                onChange={onOptionChange}
                defaultValue={selected}
                className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="" disabled>Select a camera sample</option>
                {options.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
};


export default CameraSelector;