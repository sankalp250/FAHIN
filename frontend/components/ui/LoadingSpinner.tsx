export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="rounded-full border-2 border-transparent animate-spin"
        style={{
          width: size, height: size,
          borderTopColor: "#F59E0B",
          borderRightColor: "#F97316",
        }}
      />
    </div>
  );
}
