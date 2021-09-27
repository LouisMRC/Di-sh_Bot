-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 27, 2021 at 09:51 AM
-- Server version: 10.6.4-MariaDB
-- PHP Version: 8.0.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alice_bot`
--

-- --------------------------------------------------------

--
-- Table structure for table `configs`
--

DROP TABLE IF EXISTS `configs`;
CREATE TABLE `configs` (
  `Config_ID` int(11) NOT NULL,
  `Server_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Config_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`Data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `configs`
--

INSERT INTO `configs` (`Config_ID`, `Server_ID`, `Config_name`, `Data`) VALUES
(1, '0', 'general', '\"[[\\\"prefix\\\",\\\"$\\\"],[\\\"lang\\\",\\\"en\\\"],[\\\"disable_ping\\\",\\\"false\\\"]]\"'),
(2, '0', 'env', '\"[[\\\"interpreter_args\\\",\\\"\\\"],[\\\"log_channel\\\",\\\"\\\"]]\"'),
(4, '0', 'auto_exec', '\"[[\\\"onStart\\\",\\\"\\\"]]\"'),
(5, '666767086759968818', 'auto_exec', '\"[[\\\"onStart\\\",\\\"\\\"]]\"'),
(6, '666767086759968818', 'general', '\"[[\\\"prefix\\\",\\\";\\\"],[\\\"lang\\\",\\\"en\\\"],[\\\"disable_ping\\\",\\\"false\\\"]]\"'),
(7, '666767086759968818', 'env', '\"[[\\\"interpreter_args\\\",\\\"--log\\\"],[\\\"log_channel\\\",\\\"818309813275983902\\\"]]\"');

-- --------------------------------------------------------

--
-- Table structure for table `reaction_listeners`
--

DROP TABLE IF EXISTS `reaction_listeners`;
CREATE TABLE `reaction_listeners` (
  `Listener_ID` int(11) NOT NULL,
  `Server_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Channel_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Message_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Commands` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reaction_listeners`
--

INSERT INTO `reaction_listeners` (`Listener_ID`, `Server_ID`, `Channel_ID`, `Message_ID`, `Commands`) VALUES
(1, '666767086759968818', '666816191297224744', '782808979213778975', '[]'),
(2, '666767086759968818', '666816191297224744', '782962052183359520', '[]'),
(3, '666767086759968818', '666816191297224744', '782985138761891840', '[]'),
(4, '666767086759968818', '666816191297224744', '782987807387287562', '[[\"😂\",[\"say \\\"say 😂 \\\"\"]]]'),
(5, '666767086759968818', '666816191297224744', '782997834684825641', '[[\"😉\",[\"say \\\"Hello World!\\\"\"]],[\"foobar\",[\"ping\"]]]'),
(6, '666767086759968818', '666816191297224744', '783005928639299615', '[[\"729507978612441100\",[\"ping\"]]]'),
(7, '666767086759968818', '666816191297224744', '783012428359008256', '[[\"<:foobar:729507978612441100>\",[\"ping\"]],[\"<:Spam:667007110646857740>\",[\"time\"]]]'),
(8, '666767086759968818', '667918637125861386', '783014528094699580', '[[\"<:foobar:729507978612441100>\",[\"say \\\"This Server Is Foobar!!!\\\"\"]],[\"<:Spam:667007110646857740>\",[\"say 667918597787746345 \\\"This Is A Spam!!!!\\\"\"]],[\"😂\",[\"surprise\"]]]');

-- --------------------------------------------------------

--
-- Table structure for table `role_groups`
--

DROP TABLE IF EXISTS `role_groups`;
CREATE TABLE `role_groups` (
  `Group_ID` int(11) NOT NULL,
  `Server_ID` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `Group_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `Roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`Roles`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_groups`
--

INSERT INTO `role_groups` (`Group_ID`, `Server_ID`, `Group_name`, `Roles`) VALUES
(1, '666767086759968818', 'DB_TEST_HUMAN_DEV', '[\"668420837124210698\",\"668421196324274186\"]'),
(2, '666767086759968818', 'foo', '[\"768599708058517589\",\"666777154956296209\"]'),
(3, '666767086759968818', 'listTest', '[\"787373453527089153\"]');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `Role_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Server_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Permission_level` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`Role_ID`, `Server_ID`, `Permission_level`) VALUES
('668421196324274186', '666767086759968818', 2);

-- --------------------------------------------------------

--
-- Table structure for table `scripts`
--

DROP TABLE IF EXISTS `scripts`;
CREATE TABLE `scripts` (
  `Script_ID` int(11) NOT NULL,
  `Server_ID` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `Script_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `Script` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`Script`)),
  `Permission_level` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `scripts`
--

INSERT INTO `scripts` (`Script_ID`, `Server_ID`, `Script_name`, `Script`, `Permission_level`) VALUES
(2, '666767086759968818', 'what-time-is-it', '[\"time\"]', 0),
(3, '666767086759968818', 'une-command-ultra-longue-serieusement-elle-est-tres-longue', '[\"ping\"]', 0),
(4, '666767086759968818', 'court', '[\"une-command-ultra-longue-serieusement-elle-est-tres-longue\"]', 0),
(5, '666767086759968818', 'plusieurs-commands', '[\"role count 007PING73 noping\", \"role count ApollonPlains noping\"]', 0),
(7, '666767086759968818', 'bar', '[\"ping\", \"time\"]', 0),
(10, '666767086759968818', 'baz', '[\"script show foo\",\"script show bar\",\"script show baz\",\"script show qux\"]', 0),
(11, '666767086759968818', 'alicreate', '[\"alias create\"]', 0),
(12, '666767086759968818', 'alitest', '[\"ping\"]', 0),
(13, '666767086759968818', 'delaytest', '[\"say \'delay test:\'\", \"delay 1000\" , \"say \'wait a moment...\'\", \"delay 1000\" , \"say \'succes!\'\"]', 0),
(14, '666767086759968818', 'splittest', '[\"say \'testing [Hello[World]this[is[just]a]little[test]]:\'\",\"say \'[Hello[World]this[is[just]a]little[test]]\'\",\"command_split [Hello[World]this[is[just]a]little[test]]\"]', 0),
(16, '666767086759968818', 'test', '[\"delaytest\",\"delay 1000\",\"say \\\"Exec test:\\\"\",\"say \\\"$say \'$ping\'\\\"\",\"delay 5000\",\"say \\\"Everything is ok!\\\"\",\"say \\\"👌\\\"\",\"react - 😉\"]', 0),
(17, '666767086759968818', 'sosig', '[\"say \\\"https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fi0.kym-cdn.com%2Fphotos%2Fimages%2Foriginal%2F001%2F153%2F932%2Fe0c.png&f=1&nofb=1\\\"\"]', 0),
(18, '666767086759968818', 'surprise', '[\"say 3\",\"delay 1000\",\"say 2\",\"delay 1000\",\"say 1\",\"delay 1000\",\"say \\\"SOSIG!!!!!!!\\\"\",\"sosig\"]', 0),
(19, '666767086759968818', 'secret', '[\"say \\\"Rickrolled!!!!\\\"\",\"say \\\"https://tenor.com/view/dance-moves-dancing-singer-groovy-gif-17029825\\\"\"]', 0),
(21, '666767086759968818', 'bonjour', '[\"say Bonjour!\"]', 0),
(22, '666767086759968818', 'env_channel_jmp_test', '[\"env set channel 666816191297224744\",\"say \\\"what a mess!!!\\\"\",\"env set channel 667918637125861386\",\"say \\\"Hello World!\\\"\",\"env set channel 667918597787746345\",\"say \\\"$ping\\\"\"]', 0),
(23, '666767086759968818', 'pipetest', '[\"say \\\"Let\'s React!!\\\"\",\"react - 😉\"]', 0),
(24, '666767086759968818', 'qux', '[\"foo\",\"delay 1000\",\"bar\",\"delay 1000\",\"baz\"]', 0),
(26, '666767086759968818', 'foo', '[\"ping\"]', 0),
(28, '666767086759968818', 'progress', '[\"say \\\"[----------] 0%\\\"\",\"delay 1000\",\"update - \\\"[>---------] 10%\\\"\",\"delay 1000\",\"update - \\\"[=>--------] 20%\\\"\",\"delay 1000\",\"update - \\\"[==>-------] 30%\\\"\",\"delay 1000\",\"update - \\\"[===>------] 40%\\\"\",\"delay 1000\",\"update - \\\"[====>-----] 50%\\\"\",\"delay 1000\",\"update - \\\"[=====>----] 60%\\\"\",\"delay 1000\",\"update - \\\"[======>---] 70%\\\"\",\"delay 1000\",\"update - \\\"[=======>--] 80%\\\"\",\"delay 1000\",\"update - \\\"[========>-] 90%\\\"\",\"delay 1000\",\"update - \\\"[=========>] 99%\\\"\"]', 0),
(29, '666767086759968818', 'wait', '[\"say \\\"waiting...\\\"\",\"delay 20000\",\"say \\\"Ok!\\\"\"]', 0),
(30, '666767086759968818', 'home_sweet_home', '[\"label start\",\"say home\",\"delay 2500\",\"say sweet\",\"delay 2500\",\"goto start\",\"say \\\"unreachable code\\\"\"]', 0),
(31, '666767086759968818', 'hsh_d', '[\"env show pid\",\"process stop -\",\"label start\",\"say home\",\"say sweet\",\"goto start\"]', 0),
(32, '666767086759968818', 'virus', '[\"label start\",\"virus\",\"say -\",\"goto start\"]', 0),
(33, '666767086759968818', 'pcount', '[\"label start\",\"process list\",\"delay 3000\",\"goto start\"]', 0),
(34, '666767086759968818', 'ptest', '[\"label start\",\"foo\",\"process list\",\"delay 5000\",\"goto start\"]', 0),
(35, '666767086759968818', 'general', '{}', 0),
(36, '666767086759968818', 'env', '\"[[object Map]]\"', 0),
(37, '666767086759968818', 'startup', '[\"env set channel 818309813275983902\",\"say \\\"Hello World!\\\"\",\"env set channel 666816191297224744\",\"time\"]', 0),
(38, '666767086759968818', 'maths', '[\"let n\",\"n=0\",\"n=n+12\",\"n=2*n\",\"say n*42\"]', 0),
(39, '666767086759968818', 'string', '[\"let str\",\"say str=\\\"Hello\\\"\",\"say str=str+\\\" World\\\"\",\"say str+\\\"!\\\"\"]', 0),
(40, '666767086759968818', 'args', '[\"say \\\"args[1]: \\\"+$0\"]', 0),
(41, '666767086759968818', 'cast', '[\"say (str)1+(str)1\"]', 0),
(42, '666767086759968818', 'if_test', '[\"if(1==1)\",\"{\",\"ping\",\"time\",\"}\",\"say \\\"end\\\"\"]', 0);

-- --------------------------------------------------------

--
-- Table structure for table `servers`
--

DROP TABLE IF EXISTS `servers`;
CREATE TABLE `servers` (
  `Server_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `servers`
--

INSERT INTO `servers` (`Server_ID`) VALUES
('666767086759968818'),
('727618829412204675');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `User_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Server_ID` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Permission_level` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `configs`
--
ALTER TABLE `configs`
  ADD PRIMARY KEY (`Config_ID`);

--
-- Indexes for table `reaction_listeners`
--
ALTER TABLE `reaction_listeners`
  ADD PRIMARY KEY (`Listener_ID`),
  ADD KEY `ServerID_idx` (`Server_ID`) USING BTREE,
  ADD KEY `MessageID_idx` (`Message_ID`) USING BTREE,
  ADD KEY `ChannelID` (`Listener_ID`);

--
-- Indexes for table `role_groups`
--
ALTER TABLE `role_groups`
  ADD PRIMARY KEY (`Group_ID`),
  ADD KEY `ServerID_Idx` (`Server_ID`),
  ADD KEY `GroupName_Idx` (`Group_name`) USING BTREE;

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`Role_ID`),
  ADD KEY `Permission_level_idx` (`Permission_level`),
  ADD KEY `Server_ID_idx` (`Server_ID`);

--
-- Indexes for table `scripts`
--
ALTER TABLE `scripts`
  ADD PRIMARY KEY (`Script_ID`),
  ADD KEY `ServerID_Idx` (`Server_ID`),
  ADD KEY `AliasName_Idx` (`Script_name`);

--
-- Indexes for table `servers`
--
ALTER TABLE `servers`
  ADD UNIQUE KEY `ServerID_Idx` (`Server_ID`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`User_ID`),
  ADD KEY `Server_ID_idx` (`Server_ID`),
  ADD KEY `Permission_level_idx` (`Permission_level`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `configs`
--
ALTER TABLE `configs`
  MODIFY `Config_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reaction_listeners`
--
ALTER TABLE `reaction_listeners`
  MODIFY `Listener_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `role_groups`
--
ALTER TABLE `role_groups`
  MODIFY `Group_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `scripts`
--
ALTER TABLE `scripts`
  MODIFY `Script_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
