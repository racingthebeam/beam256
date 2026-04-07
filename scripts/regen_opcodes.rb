require 'csv'
require 'uri'
require 'net/http'

OPCODES_URL="https://docs.google.com/spreadsheets/d/1TSFjvukii5MzUIKGg3EUjjwCWSFNfceQ0CGCDAwPIgI/gviz/tq?tqx=out:csv&sheet=Opcodes"
OPCODES_FILE="data/opcodes.csv"

C_OPCODES_H="include/beam256/opcodes.h"
C_OPCODES_DIR="src/core/ops"

GO_OPCODES="toolchain/internal/asm/data_opcodes.go"
GO_ENCODERS="toolchain/internal/asm/data_encoders.go"

#
# Monkeys

class NilClass
  def blank?
    true
  end
end

class String
  def blank?
    self =~ /^\s*$/
  end
end

class Symbol
  def blank?
    false
  end
end

#
# Download CSV from Google Sheets

uri = URI.parse(OPCODES_URL)
res = Net::HTTP.get(uri)
File.open(OPCODES_FILE, "w") do |f|
  f << res
end

# Column headings:
# Mnemonic
# Flag Set
# O1, O2, O3, O4
# opcode_name
# t_O1, t_O2, t_O3, t_O4
# FT - fixup type
# FO - fixup operand
# swz - swizzle
# c_F - flag size
# s_O1, s_O2, s_O3, s_O4 - operand sizes
# enc - encoding
class Opcode
  def self.parse(row)
    o = new
    o.id = row["#"].to_i
    o.m = row["Mnemonic"].downcase
    o.name = row["opcode_name"].strip
    o.flags = row["Flag Set"]
    o.encoding = row["enc"]
    o.swizzle = row["swz"]
    unless row["FT"].blank?
      o.fixup_type = row["FT"].downcase.to_sym
      o.fixup_operand = row["FO"].to_i - 1
    end
    operands = []
    (1..4).each do |ix|
      next if row["O#{ix}"].blank?
      op = Operand.new
      op.name = row["O#{ix}"]
      op.type = row["t_O#{ix}"].downcase
      operands << op
    end
    o.operands = operands
    o
  end

  attr_accessor :id
  attr_accessor :m
  attr_accessor :name
  attr_accessor :flags
  attr_accessor :encoding
  attr_accessor :swizzle
  attr_accessor :fixup_type
  attr_accessor :fixup_operand
  attr_accessor :operands

  def go_fixup_type
    case fixup_type
    when :abs then "ft.Abs"
    when :rel then "ft.PCRelJmp"
    when :call then "ft.Call"
    else raise "unknown fixup type \"#{op["FT"]}\"!"
    end
  end

  def c_decode_code
    enc_spec = ENCODERS[encoding]
    raise "unknown encoder #{encoding}" if enc_spec.nil?

    out = "// Auto-generated code, do not edit\n"
    if enc_spec.flags?
      out << gen_unsigned("flags", enc_spec.flags_width, enc_spec.flags_offset)
    end

    operands.each_with_index do |op, ix|
      swizzled_ix = swz(ix)
      aperture = enc_spec.aperture_for_index(swizzled_ix)
      if op.signed?
        out << gen_signed(op.name, aperture[:width], aperture[:offset])
      else
        out << gen_unsigned(op.name, aperture[:width], aperture[:offset])
      end
    end

    out
  end

private
  def gen_signed(name, width, offset)
    "WORD #{name} = ((WORD)(ins << (32 - #{width} - #{offset}))) >> (32 - #{width});\n"
  end

  def gen_unsigned(name, width, offset)
    "UWORD #{name} = (ins >> #{offset}) & ((1 << #{width}) - 1);\n"
  end

  def swz(operand_ix)
    out = swizzle.index((operand_ix + 1).to_s)
    raise "boom" if out.nil? || out < 0 || out >= operands.count
    out
  end
end

class Operand
  attr_accessor :name
  attr_accessor :type

  def go_type
    if type == "reg"
      "REG"
    elsif type == "ct"
      "CALL_TARGET"
    elsif type =~ /^u(\d+)/
      "U#{$1}"
    elsif type =~ /^s(\d+)/
      "S#{$1}"
    elsif type =~ /^b(\d+)/
      "U#{$1}"
    else
      raise "unknown operand type \"#{type}\""
    end
  end

  def signed?
    !! (type == "ct" || type =~ /^s/)
  end
end

opcodes = []
CSV.read(OPCODES_FILE, headers: true).each_with_index do |row,ix|
  break if row[0].downcase.strip == "end"
  opcodes << Opcode.parse(row)
end

#
# Generate Go instruction definitions

ignored = Set.new(["CALL_ABS", "CALL_IND"])
ms = {}

opcodes.each do |o|
  next if ignored.include?(o.name)
  ms[o.m] ||= []
  ms[o.m] << o
end

def swizzle(count, swz)
  out = []
  (0...count).each do |i|
    out << swz[i].to_i - 1
  end

  return "[]int{#{out.join(", ")}}"
end

# min/max operand calcs are not in the spreadsheet,
# just hardcode 'em here... this will be removed
# once we add support for virtual instructions.
def min_max(op)
  if op.m == "print"
    return [1, 3, "SentinelRegister"]
  elsif op.name == "PUSH" || op.name == "POP"
    return [1, 4, "SentinelRegister"]
  else
    [op.operands.size, op.operands.size, nil]
  end
end

File.open(GO_OPCODES, "w") do |f|
  f.write("package asm\n")
  f.write("\n")
  f.write("import \"github.com/racingthebeam/beam256/toolchain/internal/ft\"\n")
  f.write("\n")
  f.write("var opcodes = map[string][]*opdef{\n")

  ms.each do |m,defs|
    f.write("\t\"#{m}\": {\n")

    defs.each do |d|
      f.write("\t\t{\n")
      f.write("\t\t\tOpcode: #{d.id},\n")
      f.write("\t\t\tOperandTypes: []operandType{#{d.operands.map(&:go_type).join(", ")}},\n")

      unless d.flags.blank?
        f.write("\t\t\tFlagSet: FLAGS_#{d.flags},\n")
      end

      # operand count
      mm = min_max(d)
      f.write("\t\t\tMinOperands: #{mm[0]},\n")
      f.write("\t\t\tMaxOperands: #{mm[1]},\n")
      unless mm[2].nil?
        f.write("\t\t\tDefaultOperand: #{mm[2]},\n")
      end

      # swizzle
      s = swizzle(mm[1], d.swizzle)

      # fixups
      unless d.fixup_type.blank?
        fo = d.fixup_operand
        f.write("\t\t\tFixupIndex: #{fo},\n")
        f.write("\t\t\tFixupType: #{d.go_fixup_type},\n")
        f.write("\t\t\tFixupWindow: ENC_#{d.encoding}.MustOpWindow(#{fo}, #{s}),\n")
      else
        f.write("\t\t\tFixupIndex: -1,\n")
      end

      # swizzle, encoding
      f.write("\t\t\tSwizzle: #{s},\n")
      f.write("\t\t\tEncoding: ENC_#{d.encoding},\n")

      f.write("\t\t},\n")
    end
    f.write("\t},\n")
  end

  f.write("}\n")
end

#
# Encoders

class Encoder
  include Enumerable

  def initialize(offsets:, widths:, flags:)
    raise "invalid offset/width count" unless offsets.size == widths.size

    @offsets = offsets
    @widths = widths
    @flags = flags
  end

  def each
    @offsets.each_with_index do |o, ix|
      yield({operand: ix, offset: o, width: @widths[ix]})
    end
  end

  def count; @offsets.length; end
  def flags?; !!@flags; end
  def flags_width; @flags[:width]; end
  def flags_offset; @flags[:offset]; end

  def aperture_for_index(ix)
    raise "invalid operand index" if ix >= @offsets.size
    { width: @widths[ix], offset: @offsets[ix] }
  end

  def to_go
    chunks = []
    if flags?
      chunks << "ce(FLAGS, #{flags_width}, #{flags_offset})"
    end

    each do |spec|
      chunks << "ce(#{spec[:operand]}, #{spec[:width]}, #{spec[:offset]})"
    end

    "encoder{#{chunks.join(", ")}}"
  end
end

def e(offsets: [], widths: [], flags: nil)
  Encoder.new(offsets: offsets, widths: widths, flags: flags)
end

ENCODERS = {
  "NONE" => e(),
  "B6_B6_B12" => e(offsets: [0, 6, 12], widths: [6, 6, 12]),
  "B24" => e(offsets: [0], widths: [24]),
  "F2_B6_B6" => e(offsets: [0, 6], widths: [6, 6], flags: {offset: 22, width: 2}),
  "F2_B6_B6_B6" => e(offsets: [0, 6, 12], widths: [6, 6, 6], flags: {offset: 22, width: 2}),
  "B6_B18" => e(offsets: [0, 6], widths: [6, 18]),
  "B6_B16" => e(offsets: [0, 6], widths: [6, 16]),
  "B6_B6_B6_B6" => e(offsets: [0, 6, 12, 18], widths: [6, 6, 6, 6]),
  "B6" => e(offsets: [0], widths: [6]),
  "F2_B6_B16" => e(offsets: [0, 6], widths: [6, 16], flags: {offset: 22, width: 2}),
  "B6_B9_B9" => e(offsets: [0, 6, 15], widths: [6, 9, 9]),
  "B8_B16" => e(offsets: [0, 8], widths: [8, 16]),
  "B8_B6" => e(offsets: [0, 8], widths: [8, 6]),
  "B8_B6_B5_B5" => e(offsets: [0, 8, 14, 19], widths: [8, 6, 5, 5]),
  "B8_B6_B6" => e(offsets: [0, 8, 14], widths: [8, 6, 6]),
  "F2_B6_B6_B10" => e(offsets: [0, 6, 12], widths: [6, 6, 10], flags: {offset: 22, width: 2})
}

File.open(GO_ENCODERS, "w") do |f|
  f.write("package asm\n")
  f.write("\n")
  f.write("var (\n")
  ENCODERS.each do |k,v|
    f.write("\tENC_#{k} = #{v.to_go}\n")
  end
  f.write(")\n")
end

#
# Generate C opcodes

File.open(C_OPCODES_H, "w") do |f|
  f.write("#pragma once\n")
  f.write("\n")
  f.write("// This file was auto-generated on #{Time.now.to_s}\n")
  f.write("// To regenerate, run `make regen` from the project root\n")
  f.write("\n")

  opcodes.each do |o|
    f.write("#define OP_#{o.name} #{o.id}\n")
  end
end

#
# Generate C op implementations

c_all = ""
opcodes.each do |o|
  c_all << "#include \"#{o.name}.inc.c\"\n"

  file = "#{C_OPCODES_DIR}/#{o.name}.inc.c"
  if !File.exist?(file)
    File.open(file, "w") do |f|
      f.write("START_OP(OP_#{o.name})\n")
      f.write("// START-DECODE\n")
      f.write("// END-DECODE\n")
      f.write("\n")
      f.write("END_OP()\n")
    end
  end

  lines = File.read(file).split("\n")
  state = :before
  File.open(file, "w") do |f|
    lines.each do |l|
      if state == :before
        f.write(l + "\n")
        if l =~ /START-DECODE/
          state = :in
          f.write(o.c_decode_code)
        end
      elsif state == :in
        if l =~ /END-DECODE/
          state = :after
          f.write(l + "\n")
        end
      else
        f.write(l + "\n")
      end
    end
  end
end

File.open("#{C_OPCODES_DIR}/all.inc.c", "w") { |f| f.write(c_all) }
