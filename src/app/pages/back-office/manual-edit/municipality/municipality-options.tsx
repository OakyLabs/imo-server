type MunicipalityOptionProps = {
  municipalities: Array<{
    name: string;
    id: number;
  }>;
};

export function MunicipalityOptions(props: MunicipalityOptionProps) {
  return (
    <>
      <option selected disabled value="">
        Select Municipality
      </option>
      {props.municipalities.map((municipality) => (
        <option key={municipality.name} value={municipality.id}>
          {municipality.name}
        </option>
      ))}
    </>
  );
}
