import React, { useEffect, useState } from "react";
import { fetchLatestCommitHash } from "../services/github";

const VersionBox: React.FC = () => {
    const [hash, setHash] = useState<string>('');

    useEffect(() => {
        const fetchHash = async () => {
            try {
                const newHash = await fetchLatestCommitHash();
                setHash(newHash.substring(1, 7));
            } catch (error) {
                console.error('Error fetching commit hash:', error);
            }
        };

        fetchHash();
    }, []);

    return (
        <p className='min-w-[400px] mb-2 text-center text-gray-500 bg-black border border-gray-400 rounded text-xs p-1'>
            version : {hash}
        </p>
    );
};

export default VersionBox;