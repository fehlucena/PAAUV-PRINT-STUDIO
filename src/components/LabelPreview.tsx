import React, { forwardRef } from "react";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import { Rnd } from "react-rnd";
import { LabelConfig, CustomElement } from "../types";

interface LabelPreviewProps {
  config: LabelConfig;
  configs?: LabelConfig[];
  updateConfig?: (key: keyof LabelConfig, value: any) => void;
}

const SafeBarcode = ({ value, format }: { value: string; format: string }) => {
  // Try to render barcode. Some formats like EAN13 require exactly 13 chars.
  // If invalid, we show a fallback. react-barcode handles errors internally but sometimes throws.
  try {
    let validValue = value;
    if (format === "EAN13" && value.length !== 12 && value.length !== 13) {
      return (
        <div className="text-[10px] text-red-500 font-bold bg-red-50 p-1 border border-red-200">
          EAN-13 inválido (12-13 dígitos)
        </div>
      );
    }
    if (format === "UPC" && value.length !== 11 && value.length !== 12) {
      return (
        <div className="text-[10px] text-red-500 font-bold bg-red-50 p-1 border border-red-200">
          UPC-A inválido (11-12 dígitos)
        </div>
      );
    }

    return (
      <Barcode
        value={validValue || "000"}
        format={format as any}
        renderer="svg"
        width={1.5}
        height={25}
        displayValue={false}
        margin={0}
        background="transparent"
        lineColor="#000000"
      />
    );
  } catch (e) {
    return <div className="text-[9px] text-red-500">Erro na Simbologia</div>;
  }
};

const SingleTag: React.FC<{
  config: LabelConfig;
  isLast: boolean;
  colWidth: number;
  isEmpty?: boolean;
  updateConfig?: (key: keyof LabelConfig, value: any) => void;
}> = ({ config, isLast, colWidth, isEmpty, updateConfig }) => {
  if (isEmpty) {
    return (
      <div
        className={`relative ${
          !isLast ? "border-r border-dashed border-gray-300" : ""
        }`}
        style={{
          width: `${colWidth}mm`,
          height: `${config.height}mm`,
          overflow: "hidden",
        }}
      ></div>
    );
  }

  const renderHeaderLayout = () => {
    const logoEl =
      config.showLogo && config.logoBase64 ? (
        <img
          src={config.logoBase64}
          alt="Logo"
          className="max-w-full object-contain shrink-0"
          style={{ maxHeight: `${config.logoSize}mm` }}
        />
      ) : null;

    const marcaEl = config.showMarca ? (
      <div
        className={`uppercase leading-[1.1] tracking-tight ${config.marcaBold ? "font-black" : "font-medium"} ${config.marcaItalic ? "italic" : ""}`}
        style={{
          fontSize: `${config.sizeMarca}px`,
          textAlign: config.marcaAlign,
        }}
      >
        {config.marca}
      </div>
    ) : null;

    if (!logoEl && !marcaEl) return null;

    let layoutClass = "flex items-center";

    if (config.headerLayout === "logo-left")
      layoutClass = "flex flex-row items-center";
    else if (config.headerLayout === "logo-right")
      layoutClass = "flex flex-row-reverse items-center";
    else if (config.headerLayout === "logo-top")
      layoutClass = "flex flex-col items-center";
    else if (config.headerLayout === "logo-bottom")
      layoutClass = "flex flex-col-reverse items-center";
    else if (config.headerLayout === "space-between")
      layoutClass = "flex flex-row items-center justify-between w-full";

    const gapStyle =
      config.headerLayout === "space-between"
        ? {}
        : { gap: `${config.headerGap}mm` };

    return (
      <div className={`${layoutClass} max-w-[80%]`} style={gapStyle}>
        {logoEl}
        {marcaEl}
      </div>
    );
  };

  if (config.labelType === "logistics") {
    return (
      <div
        className={`flex flex-col overflow-hidden text-black bg-white relative ${!isLast ? "border-r border-dashed border-slate-300" : ""}`}
        style={{
          width: `${colWidth}mm`,
          height: `${config.height}mm`,
          fontFamily: config.fontFamily,
        }}
      >
        <div
          className="flex flex-col h-full w-full"
          style={{
            paddingTop: `${config.paddingTop ?? 4}mm`,
            paddingBottom: `${config.paddingBottom ?? 2}mm`,
            paddingLeft: `${config.paddingHorizontal ?? 3}mm`,
            paddingRight: `${config.paddingHorizontal ?? 3}mm`,
          }}
        >
          {/* Logo and Marca Header using renderHeaderLayout style */}
          <div className={`flex justify-${config.headerLayout === 'logo-right' ? 'end' : config.headerLayout === 'space-between' ? 'between' : 'start'} w-full mb-[2mm] shrink-0`}>
             {renderHeaderLayout()}
          </div>

          {/* Container for elements below header that can be adjusted vertically */}
          <div style={{ marginTop: `${config.bodyMarginTop}mm` }} className="flex flex-col flex-grow relative">

            {/* Top section: Remetente */}
            <div className="flex justify-between items-start pb-[2mm] relative">
              {config.showRemetente && (
                <div className="flex flex-col w-[100%] pr-1">
                  <span
                    className="font-extrabold uppercase mb-[1mm]"
                    style={{ fontSize: `${config.remetenteSize}px` }}
                  >
                    Remetente
                  </span>
                  <span
                    className="leading-tight whitespace-pre-wrap"
                    style={{ fontSize: `${config.remetenteSize}px` }}
                  >
                    {config.remetente}
                  </span>
                </div>
              )}
            </div>
            {config.showRemetente && (
              <div className="w-full border-b-[1.5px] border-black mb-[2mm]" />
            )}
            
            {/* Conteudo (Custom Text Body) */}
            {config.showConteudo && (
              <div
                className={`flex flex-col mb-[2mm] whitespace-pre-wrap ${config.conteudoAlign === "center" ? "text-center" : config.conteudoAlign === "right" ? "text-right" : "text-left"}`}
                style={{
                  fontSize: `${config.conteudoSize}px`,
                  marginTop: `${config.conteudoMarginTop}mm`,
                }}
              >
                {config.conteudoText}
              </div>
            )}

            {/* Destinatário */}
          {config.showDestinatario && (
            <div 
              className="flex flex-col mb-[2mm] flex-grow"
              style={{ marginTop: `${config.destinatarioMarginTop}mm` }}
            >
              <span
                className="font-extrabold uppercase mb-[1mm] bg-black text-white px-1.5 py-0.5 self-start rounded-sm tracking-widest"
                style={{ fontSize: `${config.destinatarioSize - 4}px` }}
              >
                Destinatário
              </span>
              <span
                className="font-bold leading-snug whitespace-pre-wrap"
                style={{
                  fontSize: `${config.destinatarioSize}px`,
                }}
              >
                {config.destinatario}
              </span>
            </div>
          )}

          {/* Info Row: Pedido, Transportadora, Peso, Volumes */}
          {config.showInfoRow && (
            <div className="grid grid-cols-2 gap-[2mm] mb-[2mm] border-t-[1.5px] border-b-[1.5px] border-black py-[2mm] shrink-0">
              <div className="flex flex-col">
                <span
                  className="uppercase font-semibold text-black"
                  style={{ fontSize: `${config.infoRowSize - 2}px` }}
                >
                  Transportadora
                </span>
                <span
                  className="font-extrabold"
                  style={{ fontSize: `${config.infoRowSize}px` }}
                >
                  {config.transportadora}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="uppercase font-semibold text-black"
                  style={{ fontSize: `${config.infoRowSize - 2}px` }}
                >
                  Pedido / NFe
                </span>
                <span
                  className="font-extrabold"
                  style={{ fontSize: `${config.infoRowSize}px` }}
                >
                  {config.pedido}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="uppercase font-semibold text-black"
                  style={{ fontSize: `${config.infoRowSize - 2}px` }}
                >
                  Peso
                </span>
                <span
                  className="font-extrabold"
                  style={{ fontSize: `${config.infoRowSize}px` }}
                >
                  {config.peso}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="uppercase font-semibold text-black"
                  style={{ fontSize: `${config.infoRowSize - 2}px` }}
                >
                  Volumes
                </span>
                <span
                  className="font-extrabold"
                  style={{ fontSize: `${config.infoRowSize}px` }}
                >
                  {config.volumes}
                </span>
              </div>
            </div>
          )}

          {/* Movable Barcode for Logistics */}
          {config.codeType !== "NENHUM" && (
            <Rnd
              bounds="parent"
              position={{ x: config.codeX || 10, y: config.codeY || 180 }}
              disableDragging={!updateConfig}
              onDragStop={(e, d) => {
                if (updateConfig) {
                  updateConfig("codeX", d.x);
                  updateConfig("codeY", d.y);
                }
              }}
              className={`absolute z-20 ${updateConfig ? "hover:outline hover:outline-1 hover:outline-blue-500 cursor-move" : ""}`}
            >
              <div className="flex flex-col items-center justify-center shrink-0 w-full">
                {config.codeType !== "QR" ? (
                  <div className="flex flex-col items-center bg-white p-1 rounded">
                    <div className="flex items-center justify-center overflow-hidden">
                      <SafeBarcode
                        value={config.codeValue}
                        format={config.codeType}
                      />
                    </div>
                    <div
                      className="font-mono font-bold tracking-[2px] text-center w-full truncate"
                      style={{
                        marginTop: `1mm`,
                        fontSize: `10px`,
                      }}
                    >
                      {config.codeValue}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full bg-white p-1 rounded">
                    <div className="h-[20mm]">
                      <QRCode
                        value={config.codeValue || "000"}
                        size={256}
                        style={{
                          height: "100%",
                          maxWidth: "100%",
                          width: "100%",
                        }}
                      />
                    </div>
                    <div
                      className="font-mono font-bold tracking-[1px] text-center w-full truncate"
                      style={{
                        marginTop: `1mm`,
                        fontSize: `10px`,
                      }}
                    >
                      {config.codeValue}
                    </div>
                  </div>
                )}
              </div>
            </Rnd>
          )}

          </div> {/* Closes elements below header container */}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden text-black bg-white ${!isLast ? "border-r border-dashed border-slate-300" : ""}`}
      style={{
        width: `${colWidth}mm`,
        height: `${config.height}mm`,
        fontFamily: config.fontFamily,
      }}
    >
      <div
        className="flex flex-col"
        style={{
          height: config.showPrice
            ? `calc(${config.height}mm - ${config.serrilha}mm)`
            : `${config.height}mm`,
          paddingTop: `${config.paddingTop ?? 4}mm`,
          paddingBottom: `${config.paddingBottom ?? 2}mm`,
          paddingLeft: `${config.paddingHorizontal ?? 3}mm`,
          paddingRight: `${config.paddingHorizontal ?? 3}mm`,
        }}
      >
        <div className="flex justify-between items-start mb-[1mm] relative shrink-0">
          {renderHeaderLayout()}

          {config.showCat && (
            <div
              className={`bg-black text-white px-1.5 py-0.5 text-[9px] font-bold rounded-[3px] uppercase mt-[1mm] shrink-0 max-w-[25%] overflow-hidden text-ellipsis whitespace-nowrap text-center ${config.headerLayout === "space-between" ? "absolute right-0" : ""}`}
            >
              {config.cat}
            </div>
          )}
        </div>

        <div
          className="font-extrabold leading-[1.1] mb-[1mm]"
          style={{
            fontSize: `${config.sizeProduto}px`,
            textAlign: config.produtoAlign,
            marginTop: `${config.produtoMarginTop}mm`,
          }}
        >
          {config.produto}
        </div>

        <div className="flex flex-col gap-0.5 flex-grow shrink overflow-hidden">
          {config.details
            .filter((d) => d.show)
            .map((d) => (
              <div
                key={d.id}
                className={`flex border-b border-dotted border-black pb-px ${
                  config.detailsAlign === "between"
                    ? "justify-between"
                    : config.detailsAlign === "right"
                      ? "justify-end gap-1"
                      : config.detailsAlign === "center"
                        ? "justify-center gap-1"
                        : "justify-start gap-1"
                }`}
                style={{ fontSize: `${config.detailsSize}px` }}
              >
                <span className="text-black font-semibold truncate pr-1">
                  {d.label}
                </span>
                <span
                  className={`font-bold max-w-[70%] truncate ${
                    config.detailsAlign === "between"
                      ? "text-right"
                      : config.detailsAlign === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {d.value}
                </span>
              </div>
            ))}
        </div>

        {config.codeType !== "NENHUM" && (
          <div
            className="flex flex-col items-center justify-end shrink-0 w-full pt-[1mm]"
            style={{ marginTop: `${config.codeMarginTop}mm` }}
          >
            {config.codeType !== "QR" ? (
              <div className="flex flex-col items-center w-full">
                <div className="w-full flex items-center justify-center overflow-hidden h-[12mm] mb-1">
                  <SafeBarcode
                    value={config.codeValue}
                    format={config.codeType}
                  />
                </div>
                <div
                  className="font-mono font-bold tracking-[1px] text-center w-full truncate leading-none"
                  style={{
                    marginTop: `${config.barcodeTextSpacing}mm`,
                    fontSize: `${config.barcodeTextSize}px`,
                  }}
                >
                  {config.barcodeTextValue || config.codeValue}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="h-[12mm] w-[12mm]">
                  <QRCode
                    value={config.codeValue || "000"}
                    size={256}
                    style={{ height: "100%", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <div
                  className="font-mono font-bold tracking-[1px] text-center w-full truncate"
                  style={{
                    marginTop: `${config.barcodeTextSpacing}mm`,
                    fontSize: `${config.barcodeTextSize}px`,
                  }}
                >
                  {config.barcodeTextValue || config.codeValue}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {config.showPrice && (
        <div
          className="flex flex-col items-center justify-center border-t border-dashed border-transparent relative shrink-0"
          style={{ height: `${config.serrilha}mm` }}
        >
          <div className="border-[2px] border-black rounded-[6px] w-[90%] flex flex-col items-center p-[2mm] relative bg-white">
            {config.isPromo && (
              <div className="absolute -top-[7px] bg-black text-white text-[9px] font-bold px-1.5 py-px rounded-[3px] uppercase tracking-wide">
                {config.promoText}
              </div>
            )}
            <div className="flex items-baseline gap-[3px]">
              <span className="text-[13px] font-extrabold">
                {config.precoPrefix}
              </span>
              <span
                className="font-black tracking-tighter"
                style={{ fontSize: `${config.sizePreco}px` }}
              >
                {config.preco}
              </span>
            </div>
            {config.isPromo && (
              <div className="text-[11px] line-through text-black font-extrabold mt-[-2px]">
                {config.precoAntigo}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const LabelPreview = forwardRef<HTMLDivElement, LabelPreviewProps>(
  ({ config, configs, updateConfig }, ref) => {
    const colWidth = config.width / config.columns;

    return (
      <div
        ref={ref}
        className="flex bg-white shadow-sm relative"
        style={{ width: `${config.width}mm`, height: `${config.height}mm` }}
      >
        {/* Inject a dynamic print style so window.print() respects the exact label dimensions */}
        <style>
          {`
          @media print {
            @page {
              size: ${config.width}mm ${config.height}mm;
              margin: 0;
            }
            body { margin: 0; padding: 0; background-color: white; }
          }
        `}
        </style>

        {Array.from({ length: config.columns }).map((_, i) => {
          // If configs are provided, use the specific config for this column
          // If it doesn't exist (e.g., odd number of items), we can just use the base config 
          // or an empty config, but let's use the provided item if available, otherwise config.
          const hasItem = configs ? !!configs[i] : true;
          const itemConfig = (configs && configs[i]) ? { ...config, ...configs[i] } : config;
          return (
            <SingleTag
              key={i}
              config={itemConfig}
              isLast={i === config.columns - 1}
              colWidth={colWidth}
              isEmpty={!hasItem}
              updateConfig={updateConfig}
            />
          );
        })}
      </div>
    );
  },
);

LabelPreview.displayName = "LabelPreview";
