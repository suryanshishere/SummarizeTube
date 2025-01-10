import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  selectErrorMsg,
  selectSuccessMsg,
} from "store/response-thunk";

const Response = () => {
  const errorMsg = useSelector(selectErrorMsg);
  const successMsg = useSelector(selectSuccessMsg);

  return (
    <div className="absolute top-[5rem] left-1/2 transform -translate-x-1/2 text-sm text-custom-white rounded font-bold flex justify-center gap-2 z-19">
      <AnimatePresence>
        {successMsg && (
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-2 py-1 bg-custom-green rounded m-1"
          >
            {successMsg}
          </motion.p>
        )}
        {errorMsg && (
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-2 py-1 bg-custom-red rounded m-1"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Response;
