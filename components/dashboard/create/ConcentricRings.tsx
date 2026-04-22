interface ConcentricRingsProps {
  sizes: number[];
}

export function ConcentricRings({ sizes }: ConcentricRingsProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sizes.map((size) => (
        <div
          key={size}
          className="absolute rounded-full border border-[#C9A96E]/10"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}
