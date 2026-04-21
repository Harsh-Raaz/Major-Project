export default function Loader({ small = false }) {
  return (
    <div
      className={`${small ? "h-4 w-4 border-2" : "h-6 w-6 border-[3px]"} animate-spin rounded-full border-blue-600 border-t-transparent`}
    />
  );
}

