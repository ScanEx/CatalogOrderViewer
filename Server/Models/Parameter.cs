using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("parameter", Schema="catalog")]
    public class Parameter
    {
        public Parameter () {}
        [Key, Column("parameter_id")]
        public int Id { get; set; }        
        [Column("parameter_name")]
        public string Name { get; set; }
        [Column("parameter_column_name")]
        public string ColumnName { get; set; }
    }
}