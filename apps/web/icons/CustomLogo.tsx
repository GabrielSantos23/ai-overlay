import React from "react";

// Define as props para o componente, estendendo as props padrão de um SVG para
// garantir que você possa passar atributos como 'className', etc.
interface LogoProps extends React.SVGProps<SVGSVGElement> {
  // Opcional, mas útil para tipagem mais clara de cor
  fillColor?: string;
  // Define o tamanho, embora 'width' e 'height' já venham do SVGProps
}

/**
 * Componente de logo SVG customizável.
 * * @param {LogoProps} props - As props do componente.
 * @param {string} [props.width='1024'] - Largura do SVG.
 * @param {string} [props.height='1024'] - Altura do SVG.
 * @param {string} [props.fillColor='currentColor'] - Cor de preenchimento da logo.
 * @param {any} [rest] - Outras propriedades padrão de SVG (como className).
 * @returns {JSX.Element} O componente SVG.
 */
export const CustomLogo: React.FC<LogoProps> = ({
  width = "1024",
  height = "1024",
  fillColor = "currentColor", // 'currentColor' usa a cor do texto do Tailwind
  ...rest // Captura o restante das props, como 'className'
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest} // Aplica outras props como 'className'
    >
      {/* Primeiro Path */}
      <path
        d="M4.8 438.2A520.7 520.7 0 000 489.7h777.8c-2.7-5.3-6.4-10-10-14.7-133-171.8-204.5-157-306.9-161.3-34-1.4-57.2-2-193-2-72.7 0-151.7.2-228.6.4A621 621 0 0015 386.3h398.6v51.9H4.8zm779.1 103.5H.4c.8 13.8 2.1 27.5 4 41h723.4c32.2 0 50.3-18.3 56.1-41zM45 724.3s120 294.5 466.5 299.7c207 0 385-123 465.9-299.7H45z"
        fill={fillColor} // Aplica a cor customizada
      />

      {/* Segundo Path */}
      <path
        d="M511.5 0A512.2 512.2 0 0065.3 260.6l202.7-.2c158.4 0 164.2.6 195.2 2l19.1.6c66.7 2.3 148.7 9.4 213.2 58.2 35 26.5 85.6 85 115.7 126.5 27.9 38.5 35.9 82.8 17 125.2-17.5 39-55 62.2-100.4 62.2H16.7s4.2 18 10.6 37.8h970.6a510.4 510.4 0 0026.1-160.7A512.4 512.4 0 00511.5 0z"
        fill={fillColor} // Aplica a cor customizada
      />
    </svg>
  );
};

// Exporta o componente para uso
export default CustomLogo;
